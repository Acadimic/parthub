import { ColorType, MeetFrequency, MeetStatus } from '@parthhub/shared';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertMeetDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(ColorType)
  color?: ColorType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  timezoneOffset?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  durationMins?: number;

  @IsOptional()
  @IsEnum(MeetStatus)
  status?: MeetStatus;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  standards?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  batches?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  attendees?: string[];

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weekDays?: number[];

  @IsOptional()
  @IsEnum(MeetFrequency)
  frequency?: MeetFrequency;

  @IsOptional()
  @IsArray()
  cancelledDates?: Date[];
}

export class GetByMeetIdsDto {
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  ids: string[];
}
