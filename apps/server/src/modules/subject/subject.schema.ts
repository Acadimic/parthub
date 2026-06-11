import { BaseOwnerSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject extends BaseOwnerSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org', required: true })
  org: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
