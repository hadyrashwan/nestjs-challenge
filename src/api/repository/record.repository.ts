import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { RecordData } from '../types/record.data-type';

@Injectable()
export class RecordRepository {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(data: RecordData): Promise<Record> {
    const newRecord = new this.recordModel(data);
    return await newRecord.save();
  }

  async findAll(filter: RecordFilterDTO): Promise<Record[]> {
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

    return await this.recordModel.find(mongoFilter).exec();
  }

  async findById(id: string): Promise<Record> {
    return await this.recordModel.findById(id).exec();
  }

  async update(id: string, update: RecordData): Promise<Record> {
    return await this.recordModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }
}
