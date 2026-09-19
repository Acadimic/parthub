import { IsMongoId, IsNotEmpty } from 'class-validator';

/** The body of `POST standard/delete`. */
export class StandardIdDto {
  @IsNotEmpty()
  @IsMongoId()
  standardId: string;
}
