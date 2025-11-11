import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Connection, Types } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { OrderRepository } from '../repository/order.repository';
import { RecordRepository } from '../../repository/record.repository';
import { OrderResponseDTO } from '../dtos/create-order.response.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly recordRepository: RecordRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderRequestDTO,
  ): Promise<OrderResponseDTO> {
    const { recordId, quantity } = createOrderDto;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const record = await this.recordRepository.findById(recordId, {
        session,
      });
      if (!record) {
        throw new NotFoundException(`Record with ID ${recordId} not found`);
      }

      const updatedRecord = await this.recordRepository.deductQuantity(
        recordId,
        quantity,
        { session },
      );
      if (!updatedRecord) {
        throw new BadRequestException(
          `Not enough quantity for record with ID ${recordId}. Available quantity: ${record.qty}`,
        );
      }

      const newOrder = await this.orderRepository.create(
        {
          record: record.id as Types.ObjectId,
          quantity,
        },
        { session },
      );

      await session.commitTransaction();
      return OrderResponseDTO.fromEntity(newOrder);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
