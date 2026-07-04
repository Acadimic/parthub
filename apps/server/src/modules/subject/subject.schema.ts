import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubjectDocument = HydratedDocument<Subject>;

@Schema({ timestamps: true })
export class Subject extends BaseSchema {
  @Prop({ required: true })
  name: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
