import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type StudentStandardMappingDocument = HydratedDocument<StudentStandardMapping>;

@Schema({ timestamps: true })
export class StudentStandardMapping extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  student: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard', required: true })
  standard: string;

  @Prop({ type: Date })
  enrolledAt: Date;
}

export const StudentStandardMappingSchema = SchemaFactory.createForClass(StudentStandardMapping);

StudentStandardMappingSchema.index({ student: 1, standard: 1, org: 1 }, { unique: true });
StudentStandardMappingSchema.index({ org: 1, _deleted: 1 });
