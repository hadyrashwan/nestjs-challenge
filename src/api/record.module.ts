import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { RecordRepository } from './repository/record.repository';
import { RecordSchema } from './schemas/record.schema';
import { RecordService } from './services/record.service';
import { TracklistModule } from './tracklist/tracklist.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
    TracklistModule,
  ],
  controllers: [RecordController],
  providers: [RecordService, RecordRepository],
  exports: [RecordService, RecordRepository],
})
export class RecordModule {}
