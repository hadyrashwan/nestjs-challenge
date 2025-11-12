import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RecordModule } from './api/record.module';
import { OrderModule } from './api/order/order.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config';

@Module({
  imports: [
    MongooseModule.forRoot(AppConfig.mongoUrl),
    // Add cache module with in-memory store
    CacheModule.register({
      ttl: 60, // seconds
      max: 100, // maximum number of items in cache
    }),
    RecordModule,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
