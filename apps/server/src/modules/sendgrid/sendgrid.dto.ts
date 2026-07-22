import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendGridDynamicEmailDto {
  @IsNotEmpty()
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @IsNotEmpty()
  @IsString()
  templateId: string;

  @IsNotEmpty()
  dynamicTemplateData: Record<string, any>;
}

export class SendGridTextEmailDto {
  @IsNotEmpty()
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  text: string;
}

export class SendGridHtmlEmailDto {
  @IsNotEmpty()
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  html: string;

  @IsOptional()
  @IsString()
  text?: string;
}
