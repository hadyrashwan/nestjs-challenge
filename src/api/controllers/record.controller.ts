import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordService } from '../services/record.service';
import { Record } from '../schemas/record.schema';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { RecordIdParamDTO } from '../dtos/record-id-param.dto';
import { RecordResponseDTO } from '../dtos/create-record.response.dto';

@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({
    status: 201,
    description: 'Record successfully created',
    type: RecordResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Cannot create the document' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    return await this.recordService.create(request);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({
    status: 200,
    description: 'Record updated successfully',
    type: RecordResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Cannot find record to update' })
  @ApiResponse({ status: 500, description: 'Cannot update the document.' })
  async update(
    @Param() params: RecordIdParamDTO,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    return await this.recordService.update(params.id, updateRecordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [RecordResponseDTO],
  })
  @ApiQuery({ type: RecordFilterDTO })
  async findAll(@Query() filter: RecordFilterDTO): Promise<Record[]> {
    return await this.recordService.findAll(filter);
  }
}
