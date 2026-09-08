import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CollectionType } from '@parthhub/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ReactionDocument = HydratedDocument<Reaction>;

@Schema({ timestamps: true })
export class Reaction extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'collectionRef', required: true })
  collectionItem: string;

  @Prop({ type: String, enum: CollectionType, required: true })
  collectionRef: CollectionType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course: string;
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);

ReactionSchema.index({ createdBy: 1, collectionItem: 1, collectionRef: 1 }, { unique: true });
ReactionSchema.index({ org: 1, isDeleted: 1 });
