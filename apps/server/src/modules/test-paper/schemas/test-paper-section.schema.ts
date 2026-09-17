import { BaseSchema } from '@database/base.schema';
import { DefaultMarkingsSchemaDefinition } from '@database/marking.schema';
import { RichText, RichTextSchemaDefinition } from '@database/rich-text.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SectionCategoryType, SectionType } from '@repo/shared/enums';
import type { DefaultMarkingType } from '@repo/shared/interfaces';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TestPaperSectionDocument = HydratedDocument<TestPaperSection>;

/**
 * A section of a test paper, and the unit of reuse.
 *
 * One section document may be referenced by **several** papers at once — `mergeTestPapers` copies
 * section ids between papers, so this is existing behaviour rather than a new capability. Two
 * consequences worth holding onto: editing a section edits every paper that references it, and a
 * section therefore carries no back-reference to "its" paper, because there may be many.
 *
 * Questions point *at* a section (`Question.section`) rather than being listed here, so there is no
 * question array to keep in step with them.
 */
@Schema({ timestamps: true })
export class TestPaperSection extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, enum: SectionType, required: true })
  sectionType: SectionType;

  @Prop({ type: String, enum: SectionCategoryType })
  sectionCategory: SectionCategoryType;

  @Prop({ type: RichTextSchemaDefinition })
  description: RichText;

  @Prop({ type: RichTextSchemaDefinition })
  instruction: RichText;

  /** Applied to a question of a given type when that question carries no `markings` of its own. */
  @Prop({ type: DefaultMarkingsSchemaDefinition })
  defaultMarkings: DefaultMarkingType;

  /** Nested sections, ordered by array position. */
  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection' }])
  subsections: string[];
}

export const TestPaperSectionSchema = SchemaFactory.createForClass(TestPaperSection);

TestPaperSectionSchema.index({ org: 1, _deleted: 1 });
