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
import { RecordData } from '../types/record.data-type';
import { TracklistService } from '../tracklist/tracklist.service';
import { RecordResponseDTO } from '../dtos/create-record.response.dto';

@Injectable()
export class RecordService {
  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly tracklistService: TracklistService,
  ) {}

  async create(
    createRecordDto: CreateRecordRequestDTO,
  ): Promise<RecordResponseDTO> {
    const recordToCreate: RecordData = { ...createRecordDto };

    const tracklist = await this.tracklistService.addTrackList(
      createRecordDto.mbid,
    );
    recordToCreate.tracklist = tracklist || [];

    try {
      const record = await this.recordRepository.create(recordToCreate);
      return RecordResponseDTO.fromEntity(record);
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
  ): Promise<RecordResponseDTO> {
    const existingRecord = await this.recordRepository.findById(id);

    if (!existingRecord) {
      throw new NotFoundException('Record not found');
    }

    const tracklist = await this.tracklistService.updateTrackList(
      updateRecordDto.mbid,
      existingRecord.mbid,
    );

    const update: RecordData = { ...updateRecordDto };
    if (tracklist !== null) {
      update.tracklist = tracklist;
    }
    const updated = await this.recordRepository.update(id, update);
    if (!updated) {
      throw new InternalServerErrorException('Record not found after update');
    }

    return RecordResponseDTO.fromEntity(updated);
  }

  async findById(id: string): Promise<RecordResponseDTO> {
    const record = await this.recordRepository.findById(id);
    return RecordResponseDTO.fromEntity(record);
  }

  async findAll(filter: RecordFilterDTO): Promise<RecordResponseDTO[]> {
    const records = await this.recordRepository.findAll(filter);
    return RecordResponseDTO.fromEntityArray(records);
  }
}
