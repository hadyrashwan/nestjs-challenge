import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordService } from '../services/record.service';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { RecordIdParamDTO } from '../dtos/record-id-param.dto';
import { RecordResponseDTO } from '../dtos/create-record.response.dto';
import { RecordPaginationDTO } from '../dtos/record-pagination.dto';
import { PaginatedRecordResponseDTO } from '../dtos/paginated-record.response.dto';
import { RecordCache } from '../decorators/cache.decorator';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { RecordCacheInterceptor } from '../interceptors/record-cache.interceptor';

@Controller('records')
export class RecordController {
  constructor(
    private readonly recordService: RecordService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({
    status: 201,
    description: 'Record successfully created',
    type: RecordResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Cannot create the document' })
  async create(
    @Body() request: CreateRecordRequestDTO,
  ): Promise<RecordResponseDTO> {
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
  ): Promise<RecordResponseDTO> {
    return await this.recordService.update(params.id, updateRecordDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all records with optional filters and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'List of records with pagination metadata',
    type: PaginatedRecordResponseDTO,
  })
  @ApiQuery({ type: RecordFilterDTO })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of records to return (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'cursor',
    type: String,
    required: false,
    description:
      'Cursor for pagination (ID of the last record from previous page)',
  })
  @UseInterceptors(RecordCacheInterceptor)
  async findAll(
    @Query() filter: RecordFilterDTO,
    @Query() pagination: RecordPaginationDTO,
  ): Promise<PaginatedRecordResponseDTO> {
    return await this.recordService.findAllWithPagination(filter, pagination);
  }
}
