import { IsMongoId, IsNotEmpty } from 'class-validator';

/** The body of `POST subject/delete`. */
export class SubjectIdDto {
  @IsNotEmpty()
  @IsMongoId()
  subjectId: string;
}
