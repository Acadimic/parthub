import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CollectionType } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BookmarkDocument = HydratedDocument<Bookmark>;

@Schema({ timestamps: true })
export class Bookmark extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'collectionRef', required: true })
  collectionItem: string;

  @Prop({ type: String, enum: CollectionType, required: true })
  collectionRef: CollectionType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course: string;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

BookmarkSchema.index({ createdBy: 1, collectionItem: 1, collectionRef: 1 }, { unique: true });
BookmarkSchema.index({ org: 1, _deleted: 1 });
// A per-item read (how many saved this) filters by the item, which the unique index cannot serve.
BookmarkSchema.index({ collectionItem: 1, collectionRef: 1, _deleted: 1 });
