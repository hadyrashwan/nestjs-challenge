import { Test, TestingModule } from '@nestjs/testing';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { REPOSITORY_ERROR_CODES } from '../errors/mongo-errors';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordRepository } from '../repository/record.repository';
import { RecordService } from './record.service';
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TracklistService } from '../tracklist/tracklist.service';
import { RecordResponseDTO } from '../dtos/create-record.response.dto';

describe('RecordService', () => {
  let recordService: RecordService;
  let recordRepository: RecordRepository;
  let tracklistService: TracklistService;
  let consoleErrorSpy: jest.SpyInstance;

  const mockExistingRecord = {
    _id: '1',
    artist: 'Existing Artist',
    album: 'Existing Album',
    price: 100,
    qty: 10,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
    mbid: 'existing-mbid',
    tracklist: ['Track A', 'Track B'],
  };

  beforeEach(async () => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordService,
        {
          provide: RecordRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllWithPagination: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            deductQuantity: jest.fn(),
          },
        },
        {
          provide: TracklistService,
          useValue: {
            addTrackList: jest.fn(),
            updateTrackList: jest.fn(),
          },
        },
      ],
    }).compile();

    recordService = module.get<RecordService>(RecordService);
    recordRepository = module.get<RecordRepository>(RecordRepository);
    tracklistService = module.get<TracklistService>(TracklistService);

    jest
      .spyOn(RecordResponseDTO, 'fromEntity')
      .mockImplementation((record: any) => ({
        id: record._id ? record._id.toString() : record.id,
        artist: record.artist,
        album: record.album,
        price: record.price,
        qty: record.qty,
        format: record.format,
        category: record.category,
        mbid: record.mbid,
        tracklist: record.tracklist,
      }));

    jest
      .spyOn(RecordResponseDTO, 'fromEntityArray')
      .mockImplementation((records: any[]) =>
        records.map((record) => ({
          id: record._id ? record._id.toString() : record.id,
          artist: record.artist,
          album: record.album,
          price: record.price,
          qty: record.qty,
          format: record.format,
          category: record.category,
          mbid: record.mbid,
          tracklist: record.tracklist,
        })),
      );
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should create a new record', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    const savedRecord = {
      _id: '1',
      ...createRecordDto,
    };

    jest
      .spyOn(recordRepository, 'create')
      .mockResolvedValue(savedRecord as any);

    jest.spyOn(tracklistService, 'addTrackList').mockResolvedValue([]);

    const result = await recordService.create(createRecordDto);
    expect(result).toEqual(RecordResponseDTO.fromEntity(savedRecord));
    expect(recordRepository.create).toHaveBeenCalledWith({
      ...createRecordDto,
      tracklist: [],
    });
  });

  it('should create a new record with a tracklist from MusicBrainz', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
      mbid: 'some-mbid',
    };

    const tracklist = ['Track 1', 'Track 2'];

    jest.spyOn(tracklistService, 'addTrackList').mockResolvedValue(tracklist);

    const savedRecord = {
      _id: '1',
      ...createRecordDto,
      tracklist,
    };

    jest
      .spyOn(recordRepository, 'create')
      .mockResolvedValue(savedRecord as any);

    const result = await recordService.create(createRecordDto);

    expect(tracklistService.addTrackList).toHaveBeenCalledWith(
      createRecordDto.mbid,
    );
    expect(result.tracklist).toEqual(tracklist);
    expect(result).toEqual(RecordResponseDTO.fromEntity(savedRecord));
  });

  it('should create a record even if MusicBrainz call fails', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
      mbid: 'some-mbid',
    };

    const savedRecord = {
      _id: '1',
      ...createRecordDto,
    };

    jest
      .spyOn(recordRepository, 'create')
      .mockResolvedValue(savedRecord as any);

    const result = await recordService.create(createRecordDto);

    expect(result).toEqual(RecordResponseDTO.fromEntity(savedRecord));
    expect(recordRepository.create).toHaveBeenCalledWith({
      ...createRecordDto,
      tracklist: [],
    });
  });

  it('should throw a conflict exception when creating a duplicate record', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    jest
      .spyOn(recordRepository, 'create')
      .mockRejectedValue({ code: REPOSITORY_ERROR_CODES.DUPLICATE_KEY });

    await expect(recordService.create(createRecordDto)).rejects.toThrow(
      new ConflictException(
        'Record with the same artist, album, and format already exists.',
      ),
    );
  });

  it('should return an array of records', async () => {
    const records = [
      {
        _id: '1',
        artist: 'Artist 1',
        album: 'Album 1',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: undefined,
        tracklist: undefined,
      },
      {
        _id: '2',
        artist: 'Artist 2',
        album: 'Album 2',
        price: 200,
        qty: 20,
        format: RecordFormat.CD,
        category: RecordCategory.POP,
        mbid: undefined,
        tracklist: undefined,
      },
    ];

    const filter: RecordFilterDTO = {};

    jest.spyOn(recordRepository, 'findAll').mockResolvedValue(records as any);

    const result = await recordService.findAll(filter);
    expect(result).toEqual(RecordResponseDTO.fromEntityArray(records));
    expect(recordRepository.findAll).toHaveBeenCalledWith(filter);
  });

  describe('update', () => {
    it('should throw NotFoundException if record to update is not found', async () => {
      jest.spyOn(recordRepository, 'findById').mockResolvedValue(null);
      await expect(recordService.update('nonExistentId', {})).rejects.toThrow(
        new NotFoundException('Record not found'),
      );
    });

    it('should update a record and preserve tracklist if no mbid is provided', async () => {
      const updateRecordDto = { price: 120 };

      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(mockExistingRecord as any);
      jest.spyOn(tracklistService, 'updateTrackList').mockResolvedValue(null);
      jest.spyOn(recordRepository, 'update').mockResolvedValue({
        ...mockExistingRecord,
        ...updateRecordDto,
      } as any);

      const result = await recordService.update('1', updateRecordDto);

      expect(recordRepository.findById).toHaveBeenCalledWith('1');
      expect(tracklistService.updateTrackList).toHaveBeenCalledWith(
        undefined,
        mockExistingRecord.mbid,
      );
      expect(recordRepository.update).toHaveBeenCalledWith(
        '1',
        updateRecordDto,
      );
      expect(result.tracklist).toEqual(mockExistingRecord.tracklist);
      expect(result.price).toEqual(120);
    });

    it('should update a record and its tracklist if mbid is changed', async () => {
      const updateRecordDto = { mbid: 'new-mbid', price: 120 };
      const newTracklist = ['New Track 1', 'New Track 2'];

      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(mockExistingRecord as any);
      jest
        .spyOn(tracklistService, 'updateTrackList')
        .mockResolvedValue(newTracklist);
      jest.spyOn(recordRepository, 'update').mockResolvedValue({
        ...mockExistingRecord,
        ...updateRecordDto,
        tracklist: newTracklist,
      } as any);

      const result = await recordService.update('1', updateRecordDto);

      expect(recordRepository.findById).toHaveBeenCalledWith('1');
      expect(tracklistService.updateTrackList).toHaveBeenCalledWith(
        'new-mbid',
        mockExistingRecord.mbid,
      );
      expect(recordRepository.update).toHaveBeenCalledWith('1', {
        ...updateRecordDto,
        tracklist: newTracklist,
      });
      expect(result.tracklist).toEqual(newTracklist);
      expect(result.price).toEqual(120);
    });

    it('should preserve tracklist if mbid is changed but MusicBrainz API call fails', async () => {
      const updateRecordDto = { mbid: 'new-mbid', price: 120 };

      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(mockExistingRecord as any);
      jest.spyOn(tracklistService, 'updateTrackList').mockResolvedValue(null); // MusicBrainz API call fails
      jest.spyOn(recordRepository, 'update').mockResolvedValue({
        ...mockExistingRecord,
        ...updateRecordDto,
      } as any);

      const result = await recordService.update('1', updateRecordDto);

      expect(recordRepository.findById).toHaveBeenCalledWith('1');
      expect(tracklistService.updateTrackList).toHaveBeenCalledWith(
        'new-mbid',
        mockExistingRecord.mbid,
      );
      expect(recordRepository.update).toHaveBeenCalledWith(
        '1',
        updateRecordDto,
      );
      expect(result.tracklist).toEqual(mockExistingRecord.tracklist);
      expect(result.price).toEqual(120);
    });

    it('should throw InternalServerErrorException if recordRepository.update returns null', async () => {
      const updateRecordDto = { price: 120 };

      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(mockExistingRecord as any);
      jest
        .spyOn(tracklistService, 'updateTrackList')
        .mockResolvedValue(undefined);
      jest.spyOn(recordRepository, 'update').mockResolvedValue(null);

      await expect(recordService.update('1', updateRecordDto)).rejects.toThrow(
        new InternalServerErrorException('Record not found after update'),
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated records with default limit when no pagination params provided', async () => {
      const filter: RecordFilterDTO = {};
      const records = [
        { _id: '1', name: 'Record 1', price: 100, qty: 10 },
        { _id: '2', name: 'Record 2', price: 200, qty: 20 },
        { _id: '3', name: 'Record 3', price: 300, qty: 30 },
      ];

      jest
        .spyOn(recordRepository, 'findAllWithPagination')
        .mockResolvedValue(records as any);

      const result = await recordService.findAllWithPagination(filter, {
        limit: 10,
      });
      expect(result.data).toEqual(RecordResponseDTO.fromEntityArray(records));
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(recordRepository.findAllWithPagination).toHaveBeenCalledWith(
        filter,
        { limit: 11, cursor: undefined },
      );
    });

    it('should return paginated records with hasNextPage true when more records exist than limit', async () => {
      const filter: RecordFilterDTO = {};
      const records = [
        { _id: '1', name: 'Record 1', price: 100, qty: 10 },
        { _id: '2', name: 'Record 2', price: 200, qty: 20 },
        { _id: '3', name: 'Record 3', price: 300, qty: 30 },
        { _id: '4', name: 'Record 4', price: 400, qty: 40 },
      ];

      jest
        .spyOn(recordRepository, 'findAllWithPagination')
        .mockResolvedValue(records as any);

      const result = await recordService.findAllWithPagination(filter, {
        limit: 3,
      });

      expect(result.data).toEqual(
        RecordResponseDTO.fromEntityArray(records.slice(0, 3)),
      );
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe('3');
    });

    it('should return paginated records with cursor when provided', async () => {
      const filter: RecordFilterDTO = {};
      const cursor = '5';
      const records = [
        { _id: '6', name: 'Record 6', price: 600, qty: 60 },
        { _id: '7', name: 'Record 7', price: 700, qty: 70 },
      ];

      jest
        .spyOn(recordRepository, 'findAllWithPagination')
        .mockResolvedValue(records as any);

      const result = await recordService.findAllWithPagination(filter, {
        limit: 5,
        cursor,
      });
      expect(result.data).toEqual(RecordResponseDTO.fromEntityArray(records));
      expect(recordRepository.findAllWithPagination).toHaveBeenCalledWith(
        filter,
        { limit: 6, cursor },
      );
    });

    it('should cap the limit at 100', async () => {
      const filter: RecordFilterDTO = {};
      const records = new Array(105).fill(null).map((_, i) => ({
        _id: `${i + 1}`,
        name: `Record ${i + 1}`,
        price: 100,
        qty: 10,
      }));

      jest
        .spyOn(recordRepository, 'findAllWithPagination')
        .mockResolvedValue(records as any);

      const result = await recordService.findAllWithPagination(filter, {
        limit: 200,
      });
      expect(recordRepository.findAllWithPagination).toHaveBeenCalledWith(
        filter,
        { limit: 101, cursor: undefined },
      );
      expect(result.data).toEqual(
        RecordResponseDTO.fromEntityArray(records.slice(0, 100)),
      );
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe('100');
    });
  });
});
