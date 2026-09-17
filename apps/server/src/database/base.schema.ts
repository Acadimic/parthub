import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export abstract class BaseSchema {
  @Prop({ type: Boolean, default: false, required: true })
  _deleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Org', required: true, immutable: true })
  org: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, immutable: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  /**
   * Required, and filled by the change-tracking plugin's `pre('validate')` hook.
   *
   * `timestamps: true` alone is not enough to satisfy `required` on the `save()` path: Mongoose
   * applies timestamps *after* validation there, so the values are still undefined when the
   * required check runs. That is what silently disabled activity logging — `ActivityLog` is the one
   * collection written with `save()`, and every insert failed validation. The plugin now stamps
   * them before validation, exactly as it already does for `org` and `createdBy`, so the constraint
   * holds on every write path.
   */
  @Prop({ type: Date, required: true, immutable: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  updatedAt: Date;
}
