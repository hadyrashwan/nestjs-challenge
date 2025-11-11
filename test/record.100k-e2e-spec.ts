import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';

describe('RecordController (e2e) - 100k version', () => {
  let app: INestApplication;
  let recordModel;
  let consoleErrorSpy: jest.SpyInstance;
  let documentsCount = 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    recordModel = app.get('RecordModel');

    await app.init();

    documentsCount = await recordModel.countDocuments();

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should finder 100k docs', async () => {
    expect(documentsCount).toBe(100_000);
  });

  it('should filter records by album', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 9000')
      .expect(200);

    expect(response.body.length).toBe(11);
    expect(response.body[0]).toHaveProperty('album', 'Abbey Road 9000');
  });

  it('should filter records by format', async () => {
    const response = await request(app.getHttpServer())
      .get(`/records?format=${RecordFormat.VINYL}`)
      .expect(200);

    expect(response.body.length).toBe(100000);
    expect(response.body[0]).toHaveProperty('format', RecordFormat.VINYL);
  });

  it('should filter records by category', async () => {
    const response = await request(app.getHttpServer())
      .get(`/records?category=${RecordCategory.ROCK}`)
      .expect(200);

    expect(response.body.length).toBe(100000); // No pagination yet
    expect(response.body[0]).toHaveProperty('category', RecordCategory.ROCK);
  });

  it('should search records by query', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?q=Abbey Road 50019')
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('artist', 'The Beatles');
  });

  it('should combine filters correctly', async () => {
    const response = await request(app.getHttpServer())
      .get(`/records?album=Abbey Road 3000&category=${RecordCategory.ROCK}`)
      .expect(200);

    expect(response.body.length).toBe(11);
    expect(response.body[0]).toHaveProperty('artist', 'The Beatles');
    expect(response.body[0]).toHaveProperty('category', RecordCategory.ROCK);
  });

  afterAll(async () => {
    await app.close();
  });
});
