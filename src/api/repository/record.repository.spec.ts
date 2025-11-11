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

  describe('findAll', () => {
    it('should return all records if no filter is provided', async () => {
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);
      const result = await repository.findAll({});
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({});
    });

    it('should filter by artist', async () => {
      const filter: RecordFilterDTO = { artist: 'Test Artist' };
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);
      const result = await repository.findAll(filter);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({
        artist: { $regex: 'Test Artist', $options: 'i' },
      });
    });

    it('should filter by album', async () => {
      const filter: RecordFilterDTO = { album: 'Test Album' };
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);
      const result = await repository.findAll(filter);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({
        album: { $regex: 'Test Album', $options: 'i' },
      });
    });

    it('should filter by format', async () => {
      const filter: RecordFilterDTO = { format: RecordFormat.VINYL };
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);
      const result = await repository.findAll(filter);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({ format: RecordFormat.VINYL });
    });

    it('should filter by category', async () => {
      const filter: RecordFilterDTO = { category: RecordCategory.ROCK };
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);
      const result = await repository.findAll(filter);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({
        category: RecordCategory.ROCK,
      });
    });

    it('should filter by q (search query)', async () => {
      const filter: RecordFilterDTO = { q: 'Test' };
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);
      const result = await repository.findAll(filter);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({
        $or: [
          { artist: { $regex: 'Test', $options: 'i' } },
          { album: { $regex: 'Test', $options: 'i' } },
          { category: { $regex: 'Test', $options: 'i' } },
        ],
      });
    });

    it('should combine filters', async () => {
      const filter: RecordFilterDTO = {
        artist: 'Test Artist',
        category: RecordCategory.ROCK,
      };
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRecord]),
      } as any);
      const result = await repository.findAll(filter);
      expect(result).toEqual([mockRecord]);
      expect(model.find).toHaveBeenCalledWith({
        artist: { $regex: 'Test Artist', $options: 'i' },
        category: RecordCategory.ROCK,
      });
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
});
