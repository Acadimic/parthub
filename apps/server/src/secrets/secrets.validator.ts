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

  /** The account every @Private() route writes as. Optional so a deployment with no private
   *  routes in use still boots; a private write fails loudly if it is missing. */
  @IsString()
  @IsOptional()
  PRIVATE_API_EMAIL: string;

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

  /** A folder inside both buckets that every key of this deployment lives under, e.g. `acadimic-dev/`. */
  @IsString()
  @IsOptional()
  S3_PREFIX: string;

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
