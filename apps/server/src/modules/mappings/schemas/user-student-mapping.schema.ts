import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserStudentMappingDocument = HydratedDocument<UserStudentMapping>;

@Schema({ timestamps: true })
export class UserStudentMapping extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  student: string;
}

export const UserStudentMappingSchema = SchemaFactory.createForClass(UserStudentMapping);

UserStudentMappingSchema.index({ user: 1, student: 1 }, { unique: true });
UserStudentMappingSchema.index({ org: 1, _deleted: 1 });
