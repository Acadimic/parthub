import { MaterialType } from '@enums';

export interface IGetStandardSubjectMaterials {
  standard: string;
  subject: string;
}

export interface IMaterialInfo {
  durationMins: number;
  types: Record<MaterialType, number>;
}
