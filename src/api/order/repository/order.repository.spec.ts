import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderRepository } from './order.repository';
import { Order } from '../schemas/order.schema';

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let orderModel: Model<Order>;

  const mockOrder = {
    record: 'someRecordId',
    quantity: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRepository,
        {
          provide: getModelToken(Order.name),
          useValue: {
            create: jest.fn().mockResolvedValue([mockOrder]),
          },
        },
      ],
    }).compile();

    repository = module.get<OrderRepository>(OrderRepository);
    orderModel = module.get<Model<Order>>(getModelToken(Order.name));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create an order', async () => {
    const result = await repository.create(mockOrder as any);
    expect(orderModel.create).toHaveBeenCalledWith([mockOrder], {});
    expect(result).toEqual(mockOrder);
  });
});
