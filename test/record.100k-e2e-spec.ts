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

  it('should find 100k docs', async () => {
    expect(documentsCount).toBe(100_000);
  });

  it('should filter records by album', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 9000')
      .expect(200);

    expect(response.body.data.length).toBe(10);
    expect(response.body.data[0]).toHaveProperty('album', 'Abbey Road 9000');
    expect(response.body).toHaveProperty('hasNextPage');
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('should filter records by format', async () => {
    const response = await request(app.getHttpServer())
      .get(`/records?format=${RecordFormat.VINYL}`)
      .expect(200);

    expect(response.body.data.length).toBe(10);
    expect(response.body.data[0]).toHaveProperty('format', RecordFormat.VINYL);
    expect(response.body).toHaveProperty('hasNextPage');
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('should filter records by category', async () => {
    const response = await request(app.getHttpServer())
      .get(`/records?category=${RecordCategory.ROCK}`)
      .expect(200);

    expect(response.body.data.length).toBe(10);
    expect(response.body.data[0]).toHaveProperty(
      'category',
      RecordCategory.ROCK,
    );
    expect(response.body).toHaveProperty('hasNextPage');
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('should search records by query', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?q=Abbey Road 50019')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty('artist', 'The Beatles');
    expect(response.body).toHaveProperty('hasNextPage');
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('should combine filters correctly', async () => {
    const response = await request(app.getHttpServer())
      .get(`/records?album=Abbey Road 3000&category=${RecordCategory.ROCK}`)
      .expect(200);

    expect(response.body.data.length).toBe(10);
    expect(response.body.data[0]).toHaveProperty('artist', 'The Beatles');
    expect(response.body.data[0]).toHaveProperty(
      'category',
      RecordCategory.ROCK,
    );
    expect(response.body).toHaveProperty('hasNextPage');
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('should return cached response on second request with 100k dataset (cache HIT)', async () => {
    const response1 = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 8000')
      .expect(200);

    expect(response1.headers['x-cache-status']).toBe('MISS');

    const response2 = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 8000')
      .expect(200);

    expect(response2.headers['x-cache-status']).toBe('HIT');
    expect(response2.body).toEqual(response1.body);
  });

  it('should bypass cache when Cache-Control header is no-cache with 100k dataset', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 9001')
      .set('Cache-Control', 'no-cache')
      .expect(200);

    expect(response.headers['x-cache-status']).toBe('MISS');
  });

  it('should bypass cache when Pragma header is no-cache with 100k dataset', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 9002')
      .set('Pragma', 'no-cache')
      .expect(200);

    expect(response.headers['x-cache-status']).toBe('MISS');
  });

  it('should bypass cache when cursor parameter is present with 100k dataset', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 9003&limit=5')
      .expect(200);

    expect(response.body.nextCursor).not.toBeNull();

    // Use cursor to fetch next page - should bypass cache
    const responseWithCursor = await request(app.getHttpServer())
      .get(
        `/records?album=Abbey Road 9003&limit=5&cursor=${response.body.nextCursor}`,
      )
      .expect(200);

    expect(responseWithCursor.headers['x-cache-status']).toBe('MISS');
  });

  it('should have cache-control headers in response with 100k dataset', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?album=Abbey Road 9004')
      .expect(200);

    expect(response.headers).toHaveProperty('cache-control');
    expect(response.headers['cache-control']).toMatch(/public, max-age=\d+/);
    expect(response.headers).toHaveProperty('x-cache-status');
  });

  afterAll(async () => {
    await app.close();
  });
});
