import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigService } from './config.service';
import configuration from './configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [ConfigService, AppConfigService],
  exports: [ConfigService, AppConfigService],
})
export class AppConfigModule {}
