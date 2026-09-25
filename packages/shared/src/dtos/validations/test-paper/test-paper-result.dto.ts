import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import { Marking, PaperCategoryType, PaperType } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';

/**
 * One sitting of a test paper, backed by `test-paper/schemas/test-paper-result.schema.ts`.
 *
 * Every field is required: a sitting always has all of them, with an empty array or object where
 * there is nothing to say, so the body is validated whole rather than field by field. The server
 * marks it on every write — `resultMaps`, `answerMaps` and `marksObtained` are recomputed from the
 * paper's questions and whatever the client sent for them is replaced, so a score cannot be claimed.
 *
 * `_id` is minted by the client when the sitting starts, so a retried save is the same row.
 */
export class TestPaperResultDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  testPaper: string;

  /** The course the paper was sat from; a paper is only reachable through a course. */
  @IsNotEmpty()
  @IsMongoId()
  course: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  /** Practice reveals answers as it goes and is not timed; it is kept apart from real attempts. */
  @IsBoolean()
  isPractice: boolean;

  /** The option ids (or typed text) the learner gave, per question id. */
  @IsObject()
  responseMaps: Record<string, string[]>;

  /** Seconds on each question, per question id. */
  @IsObject()
  questionWiseSpendTime: Record<string, number>;

  /** Seconds until each question was answered, per question id. */
  @IsObject()
  questionWiseReplyTime: Record<string, number>;

  @IsNumber()
  totalSpendTime: number;

  @IsMongoId({ each: true })
  visited: string[];

  @IsMongoId({ each: true })
  markedForReviews: string[];

  @IsMongoId({ each: true })
  sections: string[];

  /** Every question in the paper, in the order it was sat. */
  @IsMongoId({ each: true })
  questions: string[];

  @IsObject()
  sectionWiseQuestionIdsMaps: Record<string, string[]>;

  @IsMongoId({ each: true })
  standards: string[];

  @IsMongoId({ each: true })
  subjects: string[];

  @IsNumber()
  numberOfQuestions: number;

  @IsNumber()
  durationMins: number;

  @IsNumber()
  maxMarks: number;

  @IsEnum(PaperCategoryType)
  paperCategory: PaperCategoryType;

  @IsEnum(PaperType)
  paperType: PaperType;

  @IsNumber()
  year: number;

  // ---- recomputed by the server on every write; the client sends its own marking, which is replaced ----

  /** How each question was marked. */
  @IsObject()
  resultMaps: Record<string, Marking>;

  /** The correct option ids per question, so a saved sitting can be reviewed. */
  @IsObject()
  answerMaps: Record<string, string[]>;

  @IsNumber()
  marksObtained: number;
}
