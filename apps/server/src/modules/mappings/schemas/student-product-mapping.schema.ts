import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CollectionType } from '@parthhub/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type StudentProductMappingDocument = HydratedDocument<StudentProductMapping>;

@Schema({ timestamps: true })
export class StudentProductMapping extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  student: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'collectionRef', required: true })
  collectionItem: string;

  @Prop({ type: String, enum: CollectionType, required: true })
  collectionRef: CollectionType;
}

export const StudentProductMappingSchema = SchemaFactory.createForClass(StudentProductMapping);

StudentProductMappingSchema.index({ student: 1, collectionItem: 1, collectionRef: 1, org: 1 }, { unique: true });
StudentProductMappingSchema.index({ org: 1, isDeleted: 1 });
