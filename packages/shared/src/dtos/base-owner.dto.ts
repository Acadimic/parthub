import { BaseDeleteDto } from './base-delete.dto';

export class BaseOwnerDto extends BaseDeleteDto {
  createdBy: string;
  updatedBy: string;
}
