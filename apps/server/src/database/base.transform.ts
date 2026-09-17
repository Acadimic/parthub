import { type Types } from 'mongoose';
import { type BaseSchema } from './base.schema';

/** The `BaseSchema` fields as they appear on the wire. */
export interface ITransformedBaseFields {
  _id: string;
  org: string;
  createdBy: string;
  updatedBy: string;
  /**
   * Declared `| undefined` rather than optional on purpose. An optional property does not override
   * the same key coming from an earlier spread — TypeScript widens it to `string | Date`, because
   * for all it knows the property might be absent. Always-present-but-possibly-undefined overrides
   * cleanly.
   */
  createdAt: string | undefined;
  updatedAt: string | undefined;
}

/**
 * Converts the fields every entity inherits from `BaseSchema`.
 *
 * Each service's own `getTransformed*` spreads this in rather than repeating the same six lines, so
 * a change to how ownership is serialised happens once. Everything entity-specific stays in the
 * service, where it is next to the schema it belongs to.
 *
 * Identity and ownership are converted without optional chaining: they are required, immutable and
 * stamped on insert, so a document missing one is broken and should say so. The timestamps are
 * tolerant because they are the only fields here a stored document can predate — `required` on them
 * is newer than the collections — and a transform is on the read path, where throwing would turn one
 * malformed row into a 500 for the whole list.
 */
export const getTransformedBaseFields = (doc: BaseSchema & { _id: Types.ObjectId }): ITransformedBaseFields => ({
  _id: doc._id.toString(),
  org: doc.org.toString(),
  createdBy: doc.createdBy.toString(),
  updatedBy: doc.updatedBy.toString(),
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});
