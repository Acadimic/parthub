import { BaseDeleteSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrgDocument = Org & Document;

@Schema({ timestamps: true })
export class Org extends BaseDeleteSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  type: string;

  @Prop()
  logo: string;
}

export const OrgSchema = SchemaFactory.createForClass(Org);
