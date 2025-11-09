import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from '../services/order.service';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { OrderResponseDTO } from '../dtos/create-order.response.dto';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            createOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create a new order successfully', async () => {
      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'someRecordId',
        quantity: 1,
      };
      const mockOrder: OrderResponseDTO = {
        id: 'someOrderId',
        record: 'someRecordId',
        quantity: 1,
      };

      jest.spyOn(service, 'createOrder').mockResolvedValue(mockOrder);

      const result = await controller.createOrder(createOrderDto);
      expect(result).toEqual(mockOrder);
      expect(service.createOrder).toHaveBeenCalledWith(createOrderDto);
    });

    it('should throw NotFoundException if record not found', async () => {
      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'nonExistentRecordId',
        quantity: 1,
      };

      jest
        .spyOn(service, 'createOrder')
        .mockRejectedValue(new NotFoundException('Record not found'));

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.createOrder).toHaveBeenCalledWith(createOrderDto);
    });

    it('should throw BadRequestException if not enough quantity', async () => {
      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'someRecordId',
        quantity: 10,
      };

      jest
        .spyOn(service, 'createOrder')
        .mockRejectedValue(new BadRequestException('Not enough quantity'));

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.createOrder).toHaveBeenCalledWith(createOrderDto);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'someRecordId',
        quantity: 1,
      };

      jest
        .spyOn(service, 'createOrder')
        .mockRejectedValue(
          new InternalServerErrorException('Something went wrong'),
        );

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(service.createOrder).toHaveBeenCalledWith(createOrderDto);
    });
  });
});
