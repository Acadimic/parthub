import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecretsService } from './secrets.service';
import { SecretsValidator } from './secrets.validator';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  providers: [SecretsService, SecretsValidator],
  exports: [SecretsService],
})
export class SecretsModule {}
