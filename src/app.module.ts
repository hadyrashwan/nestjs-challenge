import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RecordModule } from './api/record.module';
import { OrderModule } from './api/order/order.module';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { AppConfig } from './app.config';

@Module({
  imports: [
    MongooseModule.forRoot(AppConfig.mongoUrl),
    // Add cache module with in-memory store. In production, consider using Redis or other stores as a second Layer cache.
    CacheModule.register({
      ttl: 60, //  in milliseconds
      max: 100, // maximum number of items in cache
    }),
    // Edge deployment should be used to serve static files in production.
    // Recommended using a project template like React-Vite/Next.js for better developer experience.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    RecordModule,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
