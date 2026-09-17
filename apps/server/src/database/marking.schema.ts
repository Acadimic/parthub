import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { QuestionType } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema, SchemaDefinition } from 'mongoose';

export type MarkingDocument = HydratedDocument<Marking>;

/** Marks awarded per outcome for one question. */
@Schema({ _id: false })
export class Marking {
  @Prop({ type: Number, required: true })
  correct: number;

  @Prop({ type: Number, required: true })
  incorrect: number;

  @Prop({ type: Number, required: true })
  unattempted: number;
}

export const MarkingSchemaDefinition = SchemaFactory.createForClass(Marking);

/**
 * A section's fallback marks, keyed by question type.
 *
 * Built from the `QuestionType` enum rather than written out, so a new question type needs no schema
 * edit and the two cannot drift. This is what makes the field a real typed subdocument — each value
 * is validated as a `Marking` — rather than the `Mixed` it used to be, which validated nothing and
 * needed an explicit `markModified()` that the change-tracking plugin would have missed.
 */
const defaultMarkingsPaths = Object.values(QuestionType).reduce<SchemaDefinition>(
  (paths, questionType) => ({ ...paths, [questionType]: { type: MarkingSchemaDefinition } }),
  {},
);

// Annotated explicitly: Mongoose's inferred schema generic is too large for the compiler to
// serialize when the paths are built at runtime rather than written out.
export const DefaultMarkingsSchemaDefinition: MongooseSchema = new MongooseSchema(defaultMarkingsPaths, {
  _id: false,
});
