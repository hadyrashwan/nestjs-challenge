import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsInt, Min } from 'class-validator';

export class CreateOrderRequestDTO {
  @ApiProperty({
    description: 'ID of the record being ordered',
    type: String,
    example: '60d0fe4f53115a001f7e0001',
  })
  @IsMongoId()
  recordId: string;

  @ApiProperty({
    description: 'Quantity of records to order',
    type: Number,
    example: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
