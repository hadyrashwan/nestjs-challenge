import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TracklistService } from './tracklist.service';

@Module({
  imports: [HttpModule],
  providers: [TracklistService],
  exports: [TracklistService],
})
export class TracklistModule {}
