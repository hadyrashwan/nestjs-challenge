import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ClientSession } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { RecordData } from '../types/record.data-type';

@Injectable()
export class RecordRepository {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(data: RecordData): Promise<Record> {
    return await this.recordModel.create(data);
  }

  async findAllWithPagination(
    filter: RecordFilterDTO,
    options: { limit: number; cursor?: string },
  ): Promise<Record[]> {
    const mongoFilter: FilterQuery<Record> = {};

    if (filter.q) {
      mongoFilter.$or = [
        { artist: { $regex: filter.q, $options: 'i' } },
        { album: { $regex: filter.q, $options: 'i' } },
        { category: { $regex: filter.q, $options: 'i' } },
      ];
    }

    if (filter.artist) {
      mongoFilter.artist = { $regex: filter.artist, $options: 'i' };
    }

    if (filter.album) {
      mongoFilter.album = { $regex: filter.album, $options: 'i' };
    }

    if (filter.format) {
      mongoFilter.format = filter.format;
    }

    if (filter.category) {
      mongoFilter.category = filter.category;
    }

    if (options.cursor) {
      mongoFilter._id = { $gt: options.cursor };
    }

    return await this.recordModel
      .find(mongoFilter)
      .sort({ _id: 1 })
      .limit(options.limit)
      .exec();
  }

  async findById(
    id: string,
    options?: { session?: ClientSession },
  ): Promise<Record> {
    return await this.recordModel.findById(id, null, options).exec();
  }

  async update(id: string, update: RecordData): Promise<Record> {
    return await this.recordModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async deductQuantity(
    id: string,
    quantity: number,
    options?: { session?: ClientSession },
  ): Promise<Record | null> {
    const updatedRecord = (await this.recordModel
      .findOneAndUpdate(
        { _id: id, qty: { $gte: quantity } },
        { $inc: { qty: -quantity } },
        { new: true, ...options },
      )
      .exec()) as Record | null;
    return updatedRecord;
  }
}
