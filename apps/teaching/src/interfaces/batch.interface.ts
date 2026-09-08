import { type IBatch } from '@stores';

export interface IBatchUser {
  user: string;
  batch: string;
}

export interface IBatchUpsert {
  batch: IBatch;
  users: string[];
}
