import { MaterialType } from '@enums';

export interface IGetDataForStandardSubject {
  standard: string;
  subject: string;
}

export interface IMaterialInfo {
  durationMins: number;
  types: Record<MaterialType, number>;
}
