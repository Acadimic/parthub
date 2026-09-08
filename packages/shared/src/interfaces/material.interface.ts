import { type MaterialType } from '../enums';

export interface IMaterialInfo {
  durationMins: number;
  types: Record<MaterialType, number>;
}
