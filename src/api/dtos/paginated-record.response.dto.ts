import { ApiProperty } from '@nestjs/swagger';
import { RecordResponseDTO } from './create-record.response.dto';

export class PaginatedRecordResponseDTO {
  @ApiProperty({ type: [RecordResponseDTO] })
  data: RecordResponseDTO[];

  @ApiProperty({
    description: 'Cursor to use for fetching the next page',
    type: String,
    nullable: true,
  })
  nextCursor?: string | null;

  @ApiProperty({
    description: 'Indicates whether there are more records available',
    type: Boolean,
  })
  hasNextPage: boolean;

  constructor(
    data: RecordResponseDTO[],
    nextCursor?: string | null,
    hasNextPage = false,
  ) {
    this.data = data;
    this.nextCursor = nextCursor;
    this.hasNextPage = hasNextPage;
  }
}
