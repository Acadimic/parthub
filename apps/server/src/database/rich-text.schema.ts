import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RichTextFormat } from '@repo/shared/enums';
import type { IRichTextDoc } from '@repo/shared/interfaces';
import { Schema as MongooseSchema } from 'mongoose';

/**
 * Authored content, embedded wherever a field holds it.
 *
 * Declared once beside `base.schema.ts` rather than per module because four collections need the
 * same three fields. It is a sub-schema, not an entity: no `BaseSchema`, no ownership of its own —
 * it lives and dies with the document that holds it.
 */
@Schema({ _id: false })
export class RichText {
  /** Readers branch on this. Bumped only when a stored document needs migrating. */
  @Prop({ type: String, enum: RichTextFormat, required: true, default: RichTextFormat.DOC_V1 })
  format: RichTextFormat;

  /**
   * ProseMirror JSON, canonical.
   *
   * `Mixed` is deliberate and is the storage decision expressed in code: a native BSON subdocument,
   * so the content stays queryable, projectable and updatable in place. It is not a string holding
   * a denser encoding — that was measured and rejected in `CONTENT_EDITOR_AND_EQUATIONS.md` §8.4.
   */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  doc: IRichTextDoc;

  /**
   * Plain-text projection, denormalised on write. Search and list previews read this, never `doc`.
   *
   * Not `required`. Mongoose counts `''` as missing for a String, so `required: true` alongside
   * `default: ''` contradicts itself and rejects the one value it is guaranteed to see: empty
   * content. Every field holding a fresh `createEmptyRichText()` failed validation on save.
   */
  @Prop({ type: String, default: '' })
  text: string;
}

export const RichTextSchemaDefinition = SchemaFactory.createForClass(RichText);
