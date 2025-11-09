import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { REPOSITORY_ERROR_CODES } from '../errors/mongo-errors';
import { RecordRepository } from '../repository/record.repository';
import { Record } from '../schemas/record.schema';
import { RecordData } from '../types/record.data-type';
import { TracklistService } from '../tracklist/tracklist.service';

@Injectable()
export class RecordService {
  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly tracklistService: TracklistService,
  ) {}

  async create(createRecordDto: CreateRecordRequestDTO): Promise<Record> {
    const recordToCreate: RecordData = { ...createRecordDto };

    recordToCreate.tracklist = await this.tracklistService.addTrackList(
      createRecordDto.mbid,
    );

    try {
      return await this.recordRepository.create(recordToCreate);
    } catch (error) {
      if (error.code === REPOSITORY_ERROR_CODES.DUPLICATE_KEY) {
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
    const existingRecord = await this.recordRepository.findById(id);

    if (!existingRecord) {
      throw new NotFoundException('Record not found');
    }

    const tracklist = await this.tracklistService.updateTrackList(
      updateRecordDto.mbid,
      existingRecord.mbid,
    );

    const update: RecordData = { ...updateRecordDto, tracklist: tracklist || existingRecord.tracklist };
    const updated = await this.recordRepository.update(id, update);
    if (!updated) {
      throw new InternalServerErrorException('Record not found after update');
    }

    return updated;
  }

  async findAll(filter: RecordFilterDTO): Promise<Record[]> {
    return await this.recordRepository.findAll(filter);
  }
}
