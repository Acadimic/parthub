import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Types } from 'mongoose';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';

async function bootstrap() {
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

  await app.register(compression);
  await app.register(helmet);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOptions = {
    origin: ['*'],
    // DELETE is what `meet/:meetId` answers to; without it here the browser's preflight refused the
    // request and no session could ever be deleted from the apps.
    methods: ['GET', 'POST', 'DELETE'],
  };

  app.enableCors(corsOptions);

  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 9000, '0.0.0.0');
}

bootstrap();
