import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsString, Min, IsMongoId } from 'class-validator';

export class RecordPaginationDTO {
  @ApiPropertyOptional({
    description: 'Number of records to return (default: 10, max: 100)',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Cursor for pagination (ID of the last record from previous page)',
  })
  @IsOptional()
  @IsMongoId()
  @IsString()
  cursor?: string;
}
