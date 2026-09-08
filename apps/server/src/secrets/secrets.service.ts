import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { SecretsValidator } from './secrets.validator';

@Injectable()
export class SecretsService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.loadSecrets();
    console.log('Secrets module initialized successfully');
  }

  private async loadSecrets(): Promise<void> {
    let secrets: Record<string, string>;

    if (process.env.SERVER_ENV === 'cloud') {
      secrets = await this.loadCloudSecrets();
    } else {
      secrets = process.env as Record<string, string>;
    }

    await this.validateSecrets(secrets);
  }

  private async loadCloudSecrets(): Promise<Record<string, string>> {
    console.log('Loading secrets from cloud (placeholder)');
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {};
  }

  private async validateSecrets(secrets: Record<string, string>): Promise<void> {
    const secretsValidator = plainToClass(SecretsValidator, secrets);
    const errors = await validate(secretsValidator);

    if (errors.length > 0) {
      console.error('Secrets validation failed:', errors);
      throw new Error('Secrets validation failed');
    }

    console.log('Secrets loaded and validated successfully');
  }

  get<T>(key: string): T | undefined {
    return this.configService.get<T>(key) || undefined;
  }

  /** For a secret the caller cannot run without. Boot validation should already have caught it. */
  getOrThrow<T>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) throw new Error(`Missing required secret: ${key}`);
    return value;
  }
}
