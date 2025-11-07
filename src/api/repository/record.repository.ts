import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';

@Injectable()
export class RecordRepository {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(createRecordDto: CreateRecordRequestDTO): Promise<Record> {
    const newRecord = new this.recordModel(createRecordDto);
    return await newRecord.save();
  }

  async findAll(): Promise<Record[]> {
    return await this.recordModel.find().exec();
  }

  async findById(id: string): Promise<Record> {
    return await this.recordModel.findById(id).exec();
  }

  async update(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    return await this.recordModel
      .findByIdAndUpdate(id, updateRecordDto, { new: true })
      .exec();
  }
}
