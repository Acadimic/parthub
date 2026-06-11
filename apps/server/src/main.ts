import { initializeSecrets } from '@config';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Types } from 'mongoose';
import { Logger } from 'nestjs-pino';
import { constants } from 'zlib';
import { AppModule } from './app.module';

async function bootstrap() {
  await initializeSecrets();

  const app: NestFastifyApplication = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      genReqId: () => new Types.ObjectId().toHexString(),
    }),
    {
      rawBody: true,
      bufferLogs: true,
    },
  );

  const corsOptions = {
    origin: ['*'],
    methods: ['GET', 'POST'],
  };

  app.enableCors(corsOptions);

  await app.register(compression as any, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } } });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

bootstrap();
