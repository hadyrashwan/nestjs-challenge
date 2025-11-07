import { Test, TestingModule } from '@nestjs/testing';
import { RecordService } from './record.service';
import { RecordRepository } from '../repository/record.repository';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

describe('RecordService', () => {
  let recordService: RecordService;
  let recordRepository: RecordRepository;

  beforeEach(async () => {
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
      ],
    }).compile();

    recordService = module.get<RecordService>(RecordService);
    recordRepository = module.get<RecordRepository>(RecordRepository);
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
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    jest
      .spyOn(recordRepository, 'create')
      .mockResolvedValue(savedRecord as any);

    const result = await recordService.create(createRecordDto);
    expect(result).toEqual(savedRecord);
    expect(recordRepository.create).toHaveBeenCalledWith(createRecordDto);
  });

  it('should return an array of records', async () => {
    const records = [
      { _id: '1', name: 'Record 1', price: 100, qty: 10 },
      { _id: '2', name: 'Record 2', price: 200, qty: 20 },
    ];

    jest.spyOn(recordRepository, 'findAll').mockResolvedValue(records as any);

    const result = await recordService.findAll();
    expect(result).toEqual(records);
    expect(recordRepository.findAll).toHaveBeenCalled();
  });
});
