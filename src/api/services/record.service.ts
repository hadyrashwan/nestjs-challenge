import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RecordRepository } from '../repository/record.repository';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { Record } from '../schemas/record.schema';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

@Injectable()
export class RecordService {
  constructor(private readonly recordRepository: RecordRepository) {}

  async create(createRecordDto: CreateRecordRequestDTO): Promise<Record> {
    return await this.recordRepository.create(createRecordDto);
  }

  async update(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    const record = await this.recordRepository.findById(id);
    if (!record) {
      throw new InternalServerErrorException('Record not found');
    }

    const updated = await this.recordRepository.update(id, updateRecordDto);
    if (!updated) {
      throw new InternalServerErrorException('Failed to update record');
    }

    return updated;
  }

  async findAll(
    q?: string,
    artist?: string,
    album?: string,
    format?: RecordFormat,
    category?: RecordCategory,
  ): Promise<Record[]> {
    const allRecords = await this.recordRepository.findAll();

    const filteredRecords = allRecords.filter((record) => {
      let match = true;

      if (q) {
        match =
          match &&
          (record.artist.includes(q) ||
            record.album.includes(q) ||
            record.category.includes(q));
      }

      if (artist) {
        match = match && record.artist.includes(artist);
      }

      if (album) {
        match = match && record.album.includes(album);
      }

      if (format) {
        match = match && record.format === format;
      }

      if (category) {
        match = match && record.category === category;
      }

      return match;
    });

    return filteredRecords;
  }
}
