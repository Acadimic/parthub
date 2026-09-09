/**
 * Ownership fields every entity returns.
 *
 * Serialization rules for every contract in this folder:
 * - an ObjectId is always a `string`
 * - a timestamp is always an ISO 8601 `string`
 * - a calendar date with no time is a `YYYY-MM-DD` `string`
 * - `_deleted` is always false on a read, because every read filters deleted rows out
 * - `__v` is never sent
 */
export interface BaseFields {
  _id: string;
  _deleted: boolean;
  org: string;
  createdBy: string;
  updatedBy: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

/**
 * There is deliberately no `ResponseOf` / `ClientEntity` wrapper here any more.
 *
 * One DTO per entity is the single type, used unchanged by the server for validation and by the
 * stores for what they hold. That means the ownership fields stay optional: a write body never
 * sends them, and a row the user is still creating has none of them until the first save. Code
 * that reads one off a server response therefore narrows, rather than trusting a wrapper to have
 * promised it. `isNew` lives on `BaseOwnedDto` for the same reason.
 */
