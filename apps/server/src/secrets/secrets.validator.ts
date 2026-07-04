import { IsNotEmpty, IsOptional, IsPort, IsString } from 'class-validator';

export class SecretsValidator {
  @IsPort()
  @IsOptional()
  PORT: string;

  @IsString()
  @IsNotEmpty()
  NODE_ENV: string;

  @IsString()
  @IsNotEmpty()
  DB_URL: string;
}
