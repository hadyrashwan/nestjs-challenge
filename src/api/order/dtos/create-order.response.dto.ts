import { ApiProperty } from '@nestjs/swagger';

export class OrderResponseDTO {
  @ApiProperty({
    description: 'Unique identifier of the order',
    example: '64b9c1e62f6f8a12f3a4d567',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the record being ordered',
    type: String,
    example: '60d0fe4f53115a001f7e0001',
  })
  record: string;

  @ApiProperty({
    description: 'Quantity of records to order',
    type: Number,
    example: 1,
  })
  quantity: number;

  static fromEntity(order: any): OrderResponseDTO {
    const dto = new OrderResponseDTO();
    dto.id = order._id ? order._id.toString() : order.id;
    dto.record = order.record ? order.record.toString() : order.record;
    dto.quantity = order.quantity;
    return dto;
  }
}
