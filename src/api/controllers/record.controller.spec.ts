import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordService } from '../services/record.service';
import { RecordController } from './record.controller';

describe('RecordController', () => {
  let recordController: RecordController;
  let recordService: RecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: RecordService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
      imports: [HttpModule],
    }).compile();

    recordController = module.get<RecordController>(RecordController);
    recordService = module.get<RecordService>(RecordService);
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

    jest.spyOn(recordService, 'create').mockResolvedValue(savedRecord as any);

    const result = await recordController.create(createRecordDto);
    expect(result).toEqual(savedRecord);
    expect(recordService.create).toHaveBeenCalledWith(createRecordDto);
  });

  it('should return an array of records', async () => {
    const records = [
      { _id: '1', name: 'Record 1', price: 100, qty: 10 },
      { _id: '2', name: 'Record 2', price: 200, qty: 20 },
    ];

    const filter: RecordFilterDTO = {};

    jest.spyOn(recordService, 'findAll').mockResolvedValue(records as any);

    const result = await recordController.findAll(filter);
    expect(result).toEqual(records);
    expect(recordService.findAll).toHaveBeenCalledWith(filter);
  });
});
