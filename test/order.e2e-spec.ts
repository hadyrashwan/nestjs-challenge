import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';
import mongoose from 'mongoose';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let recordModel;
  let orderModel;
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
    orderModel = app.get('OrderModel');
    await app.init();
    await recordModel.deleteMany({});
    await orderModel.deleteMany({});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await recordModel.deleteMany({});
    await orderModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
    consoleErrorSpy.mockRestore();
  });

  it('should create a new order', async () => {
    const createRecordDto = {
      artist: 'Order Test Artist',
      album: 'Order Test Album',
      price: 50,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    const recordResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const recordId = recordResponse.body.id;

    const createOrderDto = {
      recordId: recordId,
      quantity: 2,
    };

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .send(createOrderDto)
      .expect(201);

    expect(orderResponse.body).toHaveProperty('id');
    expect(orderResponse.body).toHaveProperty('record', recordId);
    expect(orderResponse.body).toHaveProperty('quantity', 2);

    const updatedRecord = await request(app.getHttpServer())
      .get(`/records?id=${recordId}`)
      .expect(200);
    expect(updatedRecord.body.data[0]).toHaveProperty('qty', 8);
  });

  it('should return 404 if record not found for order', async () => {
    const createOrderDto = {
      recordId: new mongoose.Types.ObjectId().toHexString(), // Non-existent record ID
      quantity: 1,
    };

    await request(app.getHttpServer())
      .post('/orders')
      .send(createOrderDto)
      .expect(404);
  });

  it('should return 400 if not enough quantity for order', async () => {
    const createRecordDto = {
      artist: 'Order Test Artist 2',
      album: 'Order Test Album 2',
      price: 50,
      qty: 5,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    const recordResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    const recordId = recordResponse.body.id;

    const createOrderDto = {
      recordId: recordId,
      quantity: 10,
    };

    await request(app.getHttpServer())
      .post('/orders')
      .send(createOrderDto)
      .expect(400);
  });

  it('should return 400 if invalid data provided for order', async () => {
    const createOrderDto = {
      recordId: 'invalid-id',
      quantity: 0,
    };

    await request(app.getHttpServer())
      .post('/orders')
      .send(createOrderDto)
      .expect(400);
  });
});
