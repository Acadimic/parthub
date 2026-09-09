import { type BatchDto } from '@repo/shared/contracts';

export interface IBatchUser {
  user: string;
  batch: string;
}

export interface IBatchUpsert {
  batch: BatchDto;
  users: string[];
}
