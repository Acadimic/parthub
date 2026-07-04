import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MaterialDocument = HydratedDocument<Material>;

@Schema({ timestamps: true })
export class Material extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  type: string;

  @Prop()
  url: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
