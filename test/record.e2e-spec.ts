import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';
import mongoose from 'mongoose';

describe('RecordController (e2e)', () => {
  let app: INestApplication;
  let recordModel;
  let consoleErrorSpy: jest.SpyInstance;

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
    await recordModel.deleteMany({});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should create a new record', async () => {
    const createRecordDto = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    expect(mongoose.Types.ObjectId.isValid(response.body.id)).toBe(true);
    expect(response.body).toHaveProperty('artist', 'The Beatles');
    expect(response.body).toHaveProperty('album', 'Abbey Road');
  });

  it('should create a new record and fetch it with filters', async () => {
    const createRecordDto = {
      artist: 'The Fake Band',
      album: 'Fake Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/records?artist=The Fake Band')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(mongoose.Types.ObjectId.isValid(response.body.data[0].id)).toBe(
      true,
    );
    expect(createResponse.body.id).toEqual(response.body.data[0].id);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty('artist', 'The Fake Band');
    expect(response.body).toHaveProperty('hasNextPage');
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('should filter records by album', async () => {
    const createRecordDto = {
      artist: 'The Test Artist',
      album: 'The Test Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/records?album=The Test Album')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty('album', 'The Test Album');
  });

  it('should filter records by format', async () => {
    const createRecordDto = {
      artist: 'The Test Artist',
      album: 'The Test Album',
      price: 25,
      qty: 10,
      format: RecordFormat.CD,
      category: RecordCategory.ROCK,
    };

    await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/records?format=${RecordFormat.CD}`)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty('format', RecordFormat.CD);
  });

  it('should filter records by category', async () => {
    const createRecordDto = {
      artist: 'The Test Artist',
      album: 'The Test Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.JAZZ,
    };

    await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/records?category=${RecordCategory.JAZZ}`)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty(
      'category',
      RecordCategory.JAZZ,
    );
  });

  it('should search records by query', async () => {
    const createRecordDto = {
      artist: 'The Searchable Artist',
      album: 'The Searchable Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/records?q=Searchable art')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty(
      'artist',
      'The Searchable Artist',
    );
  });

  it('should combine filters correctly', async () => {
    const createRecordDto = {
      artist: 'The Combo Artist',
      album: 'The Combo Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.HIPHOP,
    };

    await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/records?artist=The Combo Artist&category=${RecordCategory.HIPHOP}`)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty('artist', 'The Combo Artist');
    expect(response.body.data[0]).toHaveProperty(
      'category',
      RecordCategory.HIPHOP,
    );
  });

  it('should return 404 when updating a non-existent record', async () => {
    const updateRecordDto = {
      artist: 'Does Not Exist',
    };
    await request(app.getHttpServer())
      .put('/records/507f1f77bcf86cd799439011')
      .send(updateRecordDto)
      .expect(404);
  });

  it('should return 400 when creating a record with invalid data', async () => {
    const createRecordDto = {
      // Missing required fields
      album: 'Invalid Album',
    };
    await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(400);
  });

  it('should return 400 when updating a record with invalid data', async () => {
    const createRecordDto = {
      artist: 'Valid Artist',
      album: 'Valid Album',
      price: 10,
      qty: 1,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);
    const recordId = createResponse.body.id;

    const updateRecordDto = {
      price: -10, // Invalid price
    };
    await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send(updateRecordDto)
      .expect(400);
  });

  it('should create a new record with a tracklist', async () => {
    const createRecordDto = {
      artist: 'Metallica',
      album: 'Master of Puppets',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid: 'fed37cfc-2a6d-4569-9ac0-501a7c7598eb',
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    expect(response.body).toHaveProperty('tracklist');
    expect(response.body.id).toBeDefined();
    expect(Array.isArray(response.body.tracklist)).toBe(true);
    expect(response.body.tracklist.length).toBeGreaterThan(0);
    expect(response.body.tracklist).toContain('Battery');
  });

  it('should update a record and its tracklist', async () => {
    const createRecordDto = {
      artist: 'Metallica',
      album: 'Master of Puppets',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid: 'fed37cfc-2a6d-4569-9ac0-501a7c7598eb',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const recordId = createResponse.body.id;
    const originalTracklist = createResponse.body.tracklist;

    const updateRecordDto = {
      mbid: 'c9d52105-5c20-3216-bc1b-e54918f8f688',
    };

    const updateResponse = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send(updateRecordDto)
      .expect(200);

    expect(updateResponse.body.tracklist).not.toEqual(originalTracklist);
    expect(updateResponse.body.tracklist.length).toBeGreaterThan(0);
    expect(updateResponse.body.tracklist).toContain('Numb');
  });

  it('should create a record with an empty tracklist if MusicBrainz mbid is not found', async () => {
    const createRecordDto = {
      artist: 'Artist with missing MBID',
      album: 'Album with missing MBID',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid: 'non-existent-mbid-123456789012', // A valid format but non-existent MBID
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    expect(response.body).toHaveProperty('tracklist');
    expect(Array.isArray(response.body.tracklist)).toBe(true);
    expect(response.body.tracklist).toEqual([]);
  });

  it('should preserve tracklist when updating a record without mbid', async () => {
    const createRecordDto = {
      artist: 'Artist with Tracklist',
      album: 'Album with Tracklist',
      price: 30,
      qty: 5,
      format: RecordFormat.CD,
      category: RecordCategory.POP,
      mbid: 'fed37cfc-2a6d-4569-9ac0-501a7c7598eb', // Metallica - Master of Puppets
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const recordId = createResponse.body.id;
    const originalTracklist = createResponse.body.tracklist;

    const updateRecordDto = {
      price: 35, // Update a non-mbid field
    };

    const updateResponse = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send(updateRecordDto)
      .expect(200);

    expect(updateResponse.body.tracklist).toEqual(originalTracklist);
    expect(updateResponse.body.price).toEqual(35);
  });

  it('should preserve tracklist when updating a record with the same mbid', async () => {
    const createRecordDto = {
      artist: 'Artist with Tracklist',
      album: 'Album with Tracklist',
      price: 30,
      qty: 5,
      format: RecordFormat.CD,
      category: RecordCategory.POP,
      mbid: 'fed37cfc-2a6d-4569-9ac0-501a7c7598eb', // Metallica - Master of Puppets
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const recordId = createResponse.body.id;
    const originalTracklist = createResponse.body.tracklist;

    const updateRecordDto = {
      mbid: 'fed37cfc-2a6d-4569-9ac0-501a7c7598eb', // Same MBID
      price: 35, // Update a non-mbid field
    };

    const updateResponse = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send(updateRecordDto)
      .expect(200);

    expect(updateResponse.body.tracklist).toEqual(originalTracklist);
    expect(updateResponse.body.price).toEqual(35);
  });

  it('should preserve tracklist when mbid update fails due to MusicBrainz API error', async () => {
    const createRecordDto = {
      artist: 'Artist with Tracklist',
      album: 'Album with Tracklist',
      price: 30,
      qty: 5,
      format: RecordFormat.CD,
      category: RecordCategory.POP,
      mbid: 'fed37cfc-2a6d-4569-9ac0-501a7c7598eb', // Metallica - Master of Puppets
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const recordId = createResponse.body.id;
    const originalTracklist = createResponse.body.tracklist;

    const updateRecordDto = {
      mbid: 'non-existent-mbid-123456789012', // This MBID will cause MusicBrainz API to fail
    };

    const updateResponse = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send(updateRecordDto)
      .expect(200);

    expect(updateResponse.body.tracklist).toEqual(originalTracklist);
  });

  it('should return paginated records with default limit when no pagination params provided', async () => {
    const records = [];
    for (let i = 0; i < 5; i++) {
      const createRecordDto = {
        artist: `Artist ${i}`,
        album: `Album ${i}`,
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };

      const response = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      records.push(response.body);
    }

    const response = await request(app.getHttpServer())
      .get('/records')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('hasNextPage');
    expect(response.body).toHaveProperty('nextCursor');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.hasNextPage).toBe(false);
    expect(response.body.nextCursor).toBeNull();
  });

  it('should return paginated results with custom limit', async () => {
    const records = [];
    for (let i = 0; i < 5; i++) {
      const createRecordDto = {
        artist: `Paginated Artist ${i}`,
        album: `Paginated Album ${i}`,
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };

      const response = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      records.push(response.body);
    }

    const response = await request(app.getHttpServer())
      .get('/records?limit=2')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data.length).toBe(2);
    expect(response.body.hasNextPage).toBe(true);
    expect(response.body.nextCursor).not.toBeNull();
  });

  it('should return paginated results with cursor-based pagination', async () => {
    const records = [];
    for (let i = 0; i < 5; i++) {
      const createRecordDto = {
        artist: `Cursor Artist ${i}`,
        album: `Cursor Album ${i}`,
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };

      const response = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      records.push(response.body);
    }

    const firstPageResponse = await request(app.getHttpServer())
      .get('/records?limit=2')
      .expect(200);

    expect(firstPageResponse.body.data.length).toBe(2);
    expect(firstPageResponse.body.hasNextPage).toBe(true);
    expect(firstPageResponse.body.nextCursor).not.toBeNull();

    const secondPageResponse = await request(app.getHttpServer())
      .get(`/records?limit=2&cursor=${firstPageResponse.body.nextCursor}`)
      .expect(200);

    expect(secondPageResponse.body.data.length).toBe(2);
    expect(secondPageResponse.body.data[0].artist).not.toEqual(
      firstPageResponse.body.data[0].artist,
    );
    expect(secondPageResponse.body.data[0].artist).not.toEqual(
      firstPageResponse.body.data[1].artist,
    );
    expect(secondPageResponse.body.hasNextPage).toBe(true);
  });

  it('should cap the limit at 100', async () => {
    for (let i = 0; i < 5; i++) {
      const createRecordDto = {
        artist: `Limit Test Artist ${i}`,
        album: `Limit Test Album ${i}`,
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };

      await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .get('/records?limit=200')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data.length).toBeLessThanOrEqual(100);
  });

  it('should handle invalid limit parameter', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?limit=invalid')
      .expect(400);

    expect(response.body.message).toContain('Limit must be a positive integer');
  });

  it('should handle negative limit parameter', async () => {
    const response = await request(app.getHttpServer())
      .get('/records?limit=-5')
      .expect(400);

    expect(response.body.message).toContain('Limit must be a positive integer');
  });

  it('should combine pagination and filters', async () => {
    for (let i = 0; i < 3; i++) {
      const createRecordDto = {
        artist: `Filtered Artist ${i}`,
        album: `Filtered Album ${i}`,
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };

      await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);
    }

    for (let i = 0; i < 3; i++) {
      const createRecordDto = {
        artist: `Jazz Artist ${i}`,
        album: `Jazz Album ${i}`,
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.JAZZ,
      };

      await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .get(`/records?limit=2&category=${RecordCategory.JAZZ}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data.length).toBe(2);
    expect(response.body.data[0].category).toBe(RecordCategory.JAZZ);
  });

  afterEach(async () => {
    await recordModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });
});
