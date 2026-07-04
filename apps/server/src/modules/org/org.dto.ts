import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrgDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateOrgDto extends CreateOrgDto {}
