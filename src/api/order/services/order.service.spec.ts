import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RecordFormat, RecordCategory } from '../../schemas/record.enum';
import mongoose from 'mongoose';
import { OrderRepository } from '../repository/order.repository';
import { RecordRepository } from '../../repository/record.repository';
import { getConnectionToken } from '@nestjs/mongoose';
import { OrderResponseDTO } from '../dtos/create-order.response.dto'; // Added import

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: OrderRepository;
  let recordRepository: RecordRepository;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockRecord = {
    id: new mongoose.Types.ObjectId('60d0fe4f53115a001f7e0001'),
    price: 50,
    qty: 10,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
    artist: 'Artist',
    album: 'Album',
  };

  beforeEach(async () => {
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: RecordRepository,
          useValue: {
            findById: jest.fn(),
            deductQuantity: jest.fn(),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: {
            startSession: jest.fn().mockResolvedValue(mockSession),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    recordRepository = module.get<RecordRepository>(RecordRepository);

    jest
      .spyOn(OrderResponseDTO, 'fromEntity')
      .mockImplementation((order: any) => ({
        id: order._id.toHexString(),
        record: order.record.toHexString(),
        quantity: order.quantity,
      }));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should successfully create an order and update record quantity', async () => {
      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(mockRecord as any);
      jest
        .spyOn(recordRepository, 'deductQuantity')
        .mockResolvedValue({ ...mockRecord, qty: mockRecord.qty - 2 } as any);
      jest.spyOn(orderRepository, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId('60d0fe4f53115a001f7e0002'),
        record: new mongoose.Types.ObjectId('60d0fe4f53115a001f7e0001'),
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'recordId123',
        quantity: 2,
      };

      const result = await service.createOrder(createOrderDto);

      expect(recordRepository.findById).toHaveBeenCalledWith('recordId123', {
        session: expect.any(Object),
      });
      expect(recordRepository.deductQuantity).toHaveBeenCalledWith(
        'recordId123',
        2,
        { session: expect.any(Object) },
      );

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          record: expect.any(mongoose.Types.ObjectId),
          quantity: 2,
        }),
        { session: expect.any(Object) },
      );
      const call = (orderRepository.create as jest.Mock).mock.calls[0][0];
      expect(call.record.toHexString()).toEqual('60d0fe4f53115a001f7e0001');
      expect(result).toEqual(
        OrderResponseDTO.fromEntity({
          _id: new mongoose.Types.ObjectId('60d0fe4f53115a001f7e0002'),
          record: new mongoose.Types.ObjectId('60d0fe4f53115a001f7e0001'),
          quantity: 2,
        } as any),
      );
    });

    it('should throw NotFoundException if record not found', async () => {
      jest.spyOn(recordRepository, 'findById').mockResolvedValue(null);

      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'nonExistentRecordId',
        quantity: 1,
      };

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        new NotFoundException('Record with ID nonExistentRecordId not found'),
      );
    });

    it('should throw BadRequestException if not enough quantity', async () => {
      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(mockRecord as any);
      jest
        .spyOn(recordRepository, 'deductQuantity')
        .mockRejectedValue(
          new BadRequestException(
            `Not enough quantity for record recordId123 or record not found.`,
          ),
        );

      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'recordId123',
        quantity: 2,
      };

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        new BadRequestException(
          `Not enough quantity for record recordId123 or record not found.`,
        ),
      );
      expect(recordRepository.findById).toHaveBeenCalledWith('recordId123', {
        session: expect.any(Object),
      });
      expect(recordRepository.deductQuantity).toHaveBeenCalledWith(
        'recordId123',
        2,
        { session: expect.any(Object) },
      );
    });

    it('should abort transaction if an error occurs during order creation', async () => {
      jest
        .spyOn(recordRepository, 'findById')
        .mockResolvedValue(mockRecord as any);
      jest
        .spyOn(recordRepository, 'deductQuantity')
        .mockResolvedValue({ ...mockRecord, qty: mockRecord.qty - 2 } as any);
      jest
        .spyOn(orderRepository, 'create')
        .mockRejectedValue(new InternalServerErrorException('DB error'));

      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'recordId123',
        quantity: 2,
      };

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        new InternalServerErrorException('DB error'),
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
