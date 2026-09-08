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
