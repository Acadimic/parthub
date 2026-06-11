import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class BaseDeleteSchema {
  @Prop({ type: Boolean, default: false, required: true })
  isDeleted: boolean;
}
