/**
 * Ownership fields every entity returns.
 *
 * Serialization rules for every contract in this folder:
 * - an ObjectId is always a `string`
 * - a timestamp is always an ISO 8601 `string`
 * - a calendar date with no time is a `YYYY-MM-DD` `string`
 * - `_deleted` and `__v` are never sent
 */
export interface BaseFields {
  _id: string;
  org: string;
  createdBy: string;
  updatedBy: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

/**
 * The response form of an entity's single field list.
 *
 * One DTO class per entity serves both directions, so its ownership fields must be optional:
 * a write body never sends them. On the way out they are always present, and this restores
 * that, without declaring any field a second time.
 */
export type ResponseOf<T> = Omit<T, keyof BaseFields> & BaseFields;
