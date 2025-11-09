import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class RecordIdParamDTO {
  @ApiProperty({ example: '64b9c1e62f6f8a12f3a4d567' })
  @IsMongoId()
  id: string;
}
