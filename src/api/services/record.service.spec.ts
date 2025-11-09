import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { REPOSITORY_ERROR_CODES } from '../errors/mongo-errors';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordRepository } from '../repository/record.repository';
import { RecordService } from './record.service';
import { ConflictException } from '@nestjs/common';

describe('RecordService', () => {
  let recordService: RecordService;
  let recordRepository: RecordRepository;
  let httpService: HttpService;
  let consoleErrorSpy: jest.SpyInstance;

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
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useFactory: () => ({
            get: jest.fn(),
          }),
        },
      ],
    }).compile();

    recordService = module.get<RecordService>(RecordService);
    recordRepository = module.get<RecordRepository>(RecordRepository);
    httpService = module.get<HttpService>(HttpService);
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

    const result = await recordService.create(createRecordDto);
    expect(result).toEqual(savedRecord);
    expect(recordRepository.create).toHaveBeenCalledWith(createRecordDto);
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

    const musicBrainzResponse = `
      <metadata>
        <release>
          <medium-list>
            <medium>
              <track-list>
                <track>
                  <recording>
                    <title>Track 1</title>
                  </recording>
                </track>
                <track>
                  <recording>
                    <title>Track 2</title>
                  </recording>
                </track>
              </track-list>
            </medium>
          </medium-list>
        </release>
      </metadata>
    `;

    const axiosResponse = {
      data: musicBrainzResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));

    const savedRecord = {
      _id: '1',
      ...createRecordDto,
      tracklist: ['Track 1', 'Track 2'],
    };

    jest
      .spyOn(recordRepository, 'create')
      .mockResolvedValue(savedRecord as any);

    const result = await recordService.create(createRecordDto);

    expect(httpService.get).toHaveBeenCalledWith(
      `https://beta.musicbrainz.org/ws/2/release/${createRecordDto.mbid}?inc=recordings&fmt=xml`,
    );
    expect(result.tracklist).toEqual(['Track 1', 'Track 2']);
    expect(recordRepository.create).toHaveBeenCalledWith({
      ...createRecordDto,
      tracklist: ['Track 1', 'Track 2'],
    });
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

    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(throwError(() => new Error('MusicBrainz API Error')));

    const savedRecord = {
      _id: '1',
      ...createRecordDto,
    };

    jest
      .spyOn(recordRepository, 'create')
      .mockResolvedValue(savedRecord as any);

    const result = await recordService.create(createRecordDto);

    expect(result).toEqual(savedRecord);
    expect(recordRepository.create).toHaveBeenCalledWith(createRecordDto);
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
      { _id: '1', name: 'Record 1', price: 100, qty: 10 },
      { _id: '2', name: 'Record 2', price: 200, qty: 20 },
    ];

    const filter: RecordFilterDTO = {};

    jest.spyOn(recordRepository, 'findAll').mockResolvedValue(records as any);

    const result = await recordService.findAll(filter);
    expect(result).toEqual(records);
    expect(recordRepository.findAll).toHaveBeenCalledWith(filter);
  });
});
