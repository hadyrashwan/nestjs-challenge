import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { RecordRepository } from '../repository/record.repository';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { Record } from '../schemas/record.schema';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { MONGO_ERROR_CODES } from '../errors/mongo-errors';

@Injectable()
export class RecordService {
  constructor(private readonly recordRepository: RecordRepository) {}

  async create(createRecordDto: CreateRecordRequestDTO): Promise<Record> {
    try {
      return await this.recordRepository.create(createRecordDto);
    } catch (error) {
      if (error.code === MONGO_ERROR_CODES.DUPLICATE_KEY) {
        throw new ConflictException(
          'Record with the same artist, album, and format already exists.',
        );
      }
      throw new InternalServerErrorException();
    }
  }

  async update(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    const updated = await this.recordRepository.update(id, updateRecordDto);
    if (!updated) {
      throw new InternalServerErrorException('Record not found');
    }

    return updated;
  }

  async findAll(filter: RecordFilterDTO): Promise<Record[]> {
    return await this.recordRepository.findAll(filter);
  }
}
