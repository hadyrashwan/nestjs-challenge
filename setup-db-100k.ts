import * as mongoose from 'mongoose';
import { Record, RecordSchema } from './src/api/schemas/record.schema';
import { RecordCategory, RecordFormat } from 'src/api/schemas/record.enum';

import * as dotenv from 'dotenv';
import { AppConfig } from 'src/app.config';

dotenv.config();
async function setupDatabase() {
  try {
    const recordModel: mongoose.Model<Record> = mongoose.model<Record>(
      'Record',
      RecordSchema,
    );

    await mongoose.connect(AppConfig.mongoUrl);

    await recordModel.deleteMany({});
    console.log('Existing collection cleaned up.');

    const TOTAL = 100_000;
    const CHUNK_SIZE = 5000;
    const BATCH_CONCURRENCY = 5; // number of batches to insert in parallel

    for (let i = 0; i < TOTAL; i += CHUNK_SIZE * BATCH_CONCURRENCY) {
      const promises = [];

      for (let j = 0; j < BATCH_CONCURRENCY; j++) {
        const start = i + j * CHUNK_SIZE;
        if (start >= TOTAL) break;

        // Generate chunk on-the-fly to save memory
        const chunk = Array.from(
          { length: Math.min(CHUNK_SIZE, TOTAL - start) },
          (_, idx) => ({
            artist: 'The Beatles',
            album: `Abbey Road ${start + idx + 1}`,
            price: 25,
            qty: 10,
            format: RecordFormat.VINYL,
            category: RecordCategory.ROCK,
          }),
        );

        promises.push(recordModel.insertMany(chunk));
      }

      await Promise.all(promises);
      console.log(
        `Inserted ${Math.min(i + CHUNK_SIZE * BATCH_CONCURRENCY, TOTAL)} records`,
      );
    }

    console.log(`Inserted records successfully!`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error setting up the database:', error);
    mongoose.disconnect();
  }
}

setupDatabase();
