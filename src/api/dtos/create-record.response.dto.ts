import { ApiProperty } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from './create-record.request.dto';

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
}
