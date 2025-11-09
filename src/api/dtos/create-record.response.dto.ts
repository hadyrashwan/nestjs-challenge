import { ApiProperty } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from './create-record.request.dto';
import { Record } from '../schemas/record.schema';

export class RecordResponseDTO extends CreateRecordRequestDTO {
  @ApiProperty({
    description: 'Unique identifier of the record',
    example: '64b9c1e62f6f8a12f3a4d567',
  })
  id: string;

  @ApiProperty({
    description:
      'List of track names (fetched automatically from MusicBrainz if MBID is provided)',
    example: ['Come Together', 'Something', 'Here Comes the Sun'],
    required: false,
  })
  tracklist?: string[];

  static fromEntity(record: any): RecordResponseDTO {
    const dto = new RecordResponseDTO();
    dto.id = record._id ? record._id.toString() : record.id; // Handle both _id and id
    dto.artist = record.artist;
    dto.album = record.album;
    dto.price = record.price;
    dto.qty = record.qty;
    dto.format = record.format;
    dto.category = record.category;
    dto.mbid = record.mbid;
    dto.tracklist = record.tracklist;
    return dto;
  }

  static fromEntityArray(records: any[]): RecordResponseDTO[] {
    return records.map((r) => this.fromEntity(r));
  }
}
