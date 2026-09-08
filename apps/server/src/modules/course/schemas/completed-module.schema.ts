import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CollectionType } from '@repo/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type CompletedModuleDocument = HydratedDocument<CompletedModule>;

@Schema({ timestamps: true })
export class CompletedModule extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CourseContent', required: true })
  courseModule: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'collectionRef', required: true })
  collectionItem: string;

  @Prop({ type: String, enum: CollectionType, required: true })
  collectionRef: CollectionType;

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;

  @Prop({ type: Boolean, default: false })
  isSkipped: boolean;
}

export const CompletedModuleSchema = SchemaFactory.createForClass(CompletedModule);

CompletedModuleSchema.index({ course: 1, courseModule: 1, collectionItem: 1, createdBy: 1 }, { unique: true });
CompletedModuleSchema.index({ org: 1, _deleted: 1 });
