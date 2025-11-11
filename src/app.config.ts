import * as dotenv from 'dotenv';

dotenv.config();

export const AppConfig = {
  mongoUrl:
    process.env.NODE_ENV === '100K_E2E_TEST'
      ? process.env.MONGO_URL_100K_E2E_TEST
      : process.env.MONGO_URL,
  port: process.env.PORT || 3000,
};
