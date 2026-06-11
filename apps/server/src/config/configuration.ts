import { registerAs } from '@nestjs/config';

export const configuration = {
  env: 'APP_ENV',
  name: 'APP_NAME',
  secretKey: 'WEBTOKEN_SECRET_KEY',
  expirationTime: 'WEBTOKEN_EXPIRATION_TIME',
  dbUrl: 'DB_URL',
  firebaseAuthBase64: 'FIREBASE_AUTH_BASE_64',
  privateApiKey: 'PRIVATE_API_KEY',
};

export default registerAs('app', () => {
  const config = {};
  Object.entries(configuration).forEach(([key, value]) => (config[key] = process.env[value]));
  return config;
});
