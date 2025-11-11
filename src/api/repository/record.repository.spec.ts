import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordRepository } from './record.repository';
import { Record } from '../schemas/record.schema';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { RecordFilterDTO } from '../dtos/record-filter.dto';

describe('RecordRepository', () => {
  let repository: RecordRepository;
  let model: Model<Record>;

  const mockRecord = {
    _id: 'someId',
    artist: 'Test Artist',
    album: 'Test Album',
    price: 10,
    qty: 1,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordRepository,
        {
          provide: getModelToken('Record'),
          useValue: {
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<RecordRepository>(RecordRepository);
    model = module.get<Model<Record>>(getModelToken('Record'));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a record', async () => {
      jest.spyOn(model, 'create').mockResolvedValue(mockRecord as any);
      const result = await repository.create(mockRecord);
      expect(result).toEqual(mockRecord);
      expect(model.create).toHaveBeenCalledWith(mockRecord);
    });
  });

  describe('findById', () => {
    it('should find a record by id', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRecord),
      } as any);
      const result = await repository.findById('someId');
      expect(result).toEqual(mockRecord);
      expect(model.findById).toHaveBeenCalledWith('someId', null, undefined);
    });

    it('should return null if record is not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
      const result = await repository.findById('nonExistentId');
      expect(result).toBeNull();
      expect(model.findById).toHaveBeenCalledWith(
        'nonExistentId',
        null,
        undefined,
      );
    });
  });

  describe('update', () => {
    it('should update and return the record', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRecord),
      } as any);
      const result = await repository.update('someId', { price: 20 });
      expect(result).toEqual(mockRecord);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        'someId',
        { price: 20 },
        { new: true },
      );
    });

    it('should return null if record to update is not found', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
      const result = await repository.update('nonExistentId', { price: 20 });
      expect(result).toBeNull();
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        'nonExistentId',
        { price: 20 },
        { new: true },
      );
    });
  });

  describe('findAllWithPagination', () => {
    it('should return records with default sorting and limit when no cursor provided', async () => {
      const filter: RecordFilterDTO = {};
      const options = { limit: 10 };
      jest.spyOn(model, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);

      const result = await repository.findAllWithPagination(filter, options);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({});
      expect(model.find().sort).toHaveBeenCalledWith({ _id: 1 });
      expect(model.find().sort().limit).toHaveBeenCalledWith(10);
    });

    it('should apply cursor filter when cursor is provided', async () => {
      const filter: RecordFilterDTO = {};
      const options = { limit: 10, cursor: '5' };
      jest.spyOn(model, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);

      const result = await repository.findAllWithPagination(filter, options);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({ _id: { $gt: '5' } });
    });

    it('should apply combined filter with cursor', async () => {
      const filter: RecordFilterDTO = { artist: 'Test Artist' };
      const options = { limit: 10, cursor: '5' };
      jest.spyOn(model, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);

      const result = await repository.findAllWithPagination(filter, options);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({
        artist: { $regex: 'Test Artist', $options: 'i' },
        _id: { $gt: '5' },
      });
    });

    it('should apply all filter conditions with cursor', async () => {
      const filter: RecordFilterDTO = {
        q: 'search',
        artist: 'Test Artist',
        album: 'Test Album',
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };
      const options = { limit: 10, cursor: '5' };
      jest.spyOn(model, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);

      const result = await repository.findAllWithPagination(filter, options);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({
        $or: [
          { artist: { $regex: 'search', $options: 'i' } },
          { album: { $regex: 'search', $options: 'i' } },
          { category: { $regex: 'search', $options: 'i' } },
        ],
        artist: { $regex: 'Test Artist', $options: 'i' },
        album: { $regex: 'Test Album', $options: 'i' },
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        _id: { $gt: '5' },
      });
    });
  });
});
