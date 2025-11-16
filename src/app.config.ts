import * as dotenv from 'dotenv';

dotenv.config();

const mongoUrl = (() => {
  switch (process.env.NODE_ENV) {
    case '100K_E2E_TEST':
      return process.env.MONGO_URL_100K_E2E_TEST;
    case 'E2E_TEST':
      return process.env.MONGO_URL_E2E_TEST;
    default:
      return process.env.MONGO_URL;
  }
})();

export const AppConfig = {
  mongoUrl,
  port: process.env.PORT || 3000,
};
