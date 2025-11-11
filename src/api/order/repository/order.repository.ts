import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Order } from '../schemas/order.schema';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  async create(
    order: Partial<Order>,
    options?: { session?: ClientSession },
  ): Promise<Order> {
    const [newOrder] = await this.orderModel.create([order], options || {});
    return newOrder;
  }
}
