import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { RecordCacheInterceptor } from './record-cache.interceptor';
import { PaginatedRecordResponseDTO } from '../dtos/paginated-record.response.dto';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { RecordResponseDTO } from '../dtos/create-record.response.dto';

describe('RecordCacheInterceptor', () => {
  let interceptor: RecordCacheInterceptor;
  let mockCacheManager: any;
  let mockExecutionContext: any;
  let mockCallHandler: any;
  let mockResponse: any;

  const TTL_IN_MS = 3000; // Default TTL of 3 seconds

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    };

    mockCallHandler = {
      handle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordCacheInterceptor,
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    interceptor = module.get<RecordCacheInterceptor>(RecordCacheInterceptor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cache key generation', () => {
    it('should generate correct cache keys based on request parameters', (done) => {
      const request = {
        query: { artist: 'Test-Artist', limit: 10, format: RecordFormat.VINYL },
        headers: {},
      };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);

      // Mock no cache hit to trigger the cache miss path
      mockCacheManager.get.mockResolvedValue(null);

      const freshResponse = new PaginatedRecordResponseDTO([], null, false);
      mockCallHandler.handle.mockReturnValue(of(freshResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: (value) => {
          // The cache key should be generated based on query parameters, using actual enum values
          expect(mockCacheManager.get).toHaveBeenCalledWith(
            'records:artist=Test-Artist&format=Vinyl&limit=10',
          );
          done();
        },
      });
    });
  });

  describe('intercept', () => {
    it('should return cached response when available and no cache bypass conditions', (done) => {
      const cachedResponse = new PaginatedRecordResponseDTO([], null, false);

      const request = {
        query: { artist: 'Test Artist', limit: 10 },
        headers: {},
      };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
      mockCacheManager.get.mockResolvedValue(cachedResponse);

      mockCallHandler.handle.mockReturnValue(of('unexpected'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual(cachedResponse);
          expect(mockCacheManager.get).toHaveBeenCalledWith(
            'records:artist=Test Artist&limit=10',
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            `public, max-age=${TTL_IN_MS}`,
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Cache-Status',
            'HIT',
          );
          done();
        },
      });
    });

    it('should call next.handle() and cache response when no cached data exists', (done) => {
      const recordResponse = new RecordResponseDTO();
      recordResponse.id = '1';
      recordResponse.artist = 'Test Artist';
      recordResponse.album = 'Test Album';
      recordResponse.price = 10;
      recordResponse.qty = 5;
      recordResponse.format = RecordFormat.VINYL;
      recordResponse.category = RecordCategory.ROCK;
      recordResponse.tracklist = [];

      const freshResponse = new PaginatedRecordResponseDTO(
        [recordResponse],
        'cursor123',
        true,
      );

      const request = {
        query: { artist: 'Test Artist', limit: 10 },
        headers: {},
      };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
      mockCacheManager.get.mockResolvedValue(null); // No cached data
      mockCallHandler.handle.mockReturnValue(of(freshResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual(freshResponse);
          expect(mockCacheManager.get).toHaveBeenCalledWith(
            'records:artist=Test Artist&limit=10',
          );
          expect(mockCacheManager.set).toHaveBeenCalledWith(
            'records:artist=Test Artist&limit=10',
            freshResponse,
            TTL_IN_MS,
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            `public, max-age=${TTL_IN_MS}`,
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Cache-Status',
            'MISS',
          );
          done();
        },
      });
    });

    it('should bypass cache when cursor parameter is present', (done) => {
      const request = {
        query: { artist: 'Test Artist', limit: 10, cursor: 'cursor123' },
        headers: {},
      };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
      mockCacheManager.get.mockResolvedValue(null);

      const freshResponse = new PaginatedRecordResponseDTO([], null, false);
      mockCallHandler.handle.mockReturnValue(of(freshResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual(freshResponse);
          expect(mockCacheManager.get).not.toHaveBeenCalled();
          expect(mockCacheManager.set).not.toHaveBeenCalled();
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'no-store',
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Cache-Status',
            'MISS',
          );
          done();
        },
      });
    });

    it('should bypass cache when Cache-Control: no-cache header is present', (done) => {
      const request = {
        query: { artist: 'Test Artist', limit: 10 },
        headers: { 'cache-control': 'no-cache' },
      };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
      mockCacheManager.get.mockResolvedValue(null);

      const freshResponse = new PaginatedRecordResponseDTO([], null, false);
      mockCallHandler.handle.mockReturnValue(of(freshResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual(freshResponse);
          expect(mockCacheManager.get).not.toHaveBeenCalled();
          expect(mockCacheManager.set).not.toHaveBeenCalled();
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'no-store',
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Cache-Status',
            'MISS',
          );
          done();
        },
      });
    });

    it('should bypass cache when Pragma: no-cache header is present', (done) => {
      const request = {
        query: { artist: 'Test Artist', limit: 10 },
        headers: { pragma: 'no-cache' },
      };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
      mockCacheManager.get.mockResolvedValue(null);

      const freshResponse = new PaginatedRecordResponseDTO([], null, false);
      mockCallHandler.handle.mockReturnValue(of(freshResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual(freshResponse);
          expect(mockCacheManager.get).not.toHaveBeenCalled();
          expect(mockCacheManager.set).not.toHaveBeenCalled();
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'no-store',
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Cache-Status',
            'MISS',
          );
          done();
        },
      });
    });

    it('should handle both Cache-Control and Pragma headers for cache bypass', (done) => {
      const request = {
        query: { artist: 'Test Artist', limit: 10 },
        headers: {
          'cache-control': 'no-cache',
          pragma: 'no-cache',
        },
      };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(request);
      mockCacheManager.get.mockResolvedValue(null);

      const freshResponse = new PaginatedRecordResponseDTO([], null, false);
      mockCallHandler.handle.mockReturnValue(of(freshResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual(freshResponse);
          expect(mockCacheManager.get).not.toHaveBeenCalled();
          expect(mockCacheManager.set).not.toHaveBeenCalled();
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'no-store',
          );
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Cache-Status',
            'MISS',
          );
          done();
        },
      });
    });
  });
});
