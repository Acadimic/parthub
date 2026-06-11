import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get name(): string {
    return this.configService.get<string>('app.name');
  }

  get env(): string {
    return this.configService.get<string>('app.env');
  }

  get secretKey(): string {
    return this.configService.get<string>('app.secretKey');
  }

  get expirationTime(): number {
    return Number(this.configService.get<number>('app.expirationTime'));
  }

  get dbUrl(): string {
    return this.configService.get<string>('app.dbUrl');
  }

  get firebaseAuthBase64(): string {
    return this.configService.get<string>('app.firebaseAuthBase64');
  }

  get privateApiKey(): string {
    return this.configService.get<string>('app.privateApiKey');
  }

  isEnv(env: string): boolean {
    return this.configService.get<string>('app.env') === env;
  }
}
