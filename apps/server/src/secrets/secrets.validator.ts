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

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  AWS_REGION: string;

  @IsString()
  @IsOptional()
  S3_BUCKET_NAME: string;

  @IsString()
  @IsOptional()
  S3_PUBLIC_BUCKET_NAME: string;

  @IsString()
  @IsOptional()
  SENDGRID_API_KEY: string;

  @IsString()
  @IsOptional()
  RAZORPAY_API_KEY: string;

  @IsString()
  @IsOptional()
  RAZORPAY_WEBHOOK_SECRET: string;

  @IsString()
  @IsOptional()
  RAZORPAY_SIGNATURE_SECRET: string;
}
