import { BaseOwnerSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MaterialDocument = Material & Document;

@Schema({ timestamps: true })
export class Material extends BaseOwnerSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  type: string;

  @Prop()
  url: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org', required: true })
  org: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
