import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { parseStringPromise } from 'xml2js';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { REPOSITORY_ERROR_CODES } from '../errors/mongo-errors';
import { RecordRepository } from '../repository/record.repository';
import { Record } from '../schemas/record.schema';
import { RecordData } from '../types/record.data-type';

@Injectable()
export class RecordService {
  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly httpService: HttpService,
  ) {}

  async create(createRecordDto: CreateRecordRequestDTO): Promise<Record> {
    const recordToCreate: RecordData = { ...createRecordDto };

    recordToCreate.tracklist = await this.addTrackList(createRecordDto.mbid);

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

    const tracklist = await this.updateTrackList(
      updateRecordDto.mbid,
      existingRecord.mbid,
    );

    const update: RecordData = { ...updateRecordDto, tracklist };
    const updated = await this.recordRepository.update(id, update);
    if (!updated) {
      throw new InternalServerErrorException('Record not found after update');
    }

    return updated;
  }

  async findAll(filter: RecordFilterDTO): Promise<Record[]> {
    return await this.recordRepository.findAll(filter);
  }

  private async getTracklist(mbid: string): Promise<string[]> {
    // We can offload into message queue in real-world scenario.
    const url = `https://beta.musicbrainz.org/ws/2/release/${mbid}?inc=recordings&fmt=xml`;
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const xml = response.data;
      const parsed = await parseStringPromise(xml);

      const release = parsed.metadata?.release?.[0];
      const mediumList = release?.['medium-list']?.[0];
      const medium = mediumList?.medium?.[0];
      const trackList = medium?.['track-list']?.[0];
      const tracks = trackList?.track;

      if (!tracks) {
        return [];
      }
      return tracks.map((track) => track.recording[0].title[0]);
    } catch (error) {
      const cause = {
        status: error.response?.status || 'Unknown',
        data: error.response?.data || 'No response data',
        mbid,
      };
      console.error('API error:', cause);
      throw new Error(`Failed to add tracklist MBID ${mbid}`);
    }
  }

  private async updateTrackList(newMbid: string, existingMib?: string) {
    let tracklist = undefined;
    if (newMbid !== existingMib) {
      try {
        tracklist = await this.getTracklist(newMbid);
      } catch (error) {
        console.error('Error fetching track list for updated mbid:', error);
      }
    }
    return tracklist;
  }

  private async addTrackList(mbid: string) {
    let tracklist = undefined;
    if (mbid) {
      try {
        tracklist = await this.getTracklist(mbid);
      } catch (error) {
        // For the sake of the exercise, we'll just log the error and continue
        console.error('Error fetching track list:', error);
      }
    }
    return tracklist;
  }
}
