import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SectionCategoryType, SectionType } from '@repo/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TestPaperSectionDocument = HydratedDocument<TestPaperSection>;

@Schema({ timestamps: true })
export class TestPaperSection extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, enum: SectionType, required: true })
  sectionType: SectionType;

  @Prop({ type: String, enum: SectionCategoryType })
  sectionCategory: SectionCategoryType;

  @Prop({ type: MongooseSchema.Types.Mixed })
  defaultMarkings: Record<string, Record<string, number>>;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'TestPaperSection' }])
  subsections: string[];

  @Prop({ type: String })
  instruction: string;
}

export const TestPaperSectionSchema = SchemaFactory.createForClass(TestPaperSection);

TestPaperSectionSchema.index({ org: 1, _deleted: 1 });
