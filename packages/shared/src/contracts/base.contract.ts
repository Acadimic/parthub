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
 * The response form of an entity's single field list.
 *
 * One DTO class per entity serves both directions, so its ownership fields must be optional:
 * a write body never sends them. On the way out they are always present, and this restores
 * that, without declaring any field a second time.
 */
export type ResponseOf<T> = Omit<T, keyof BaseFields> & BaseFields;

/**
 * An entity as a client store holds it.
 *
 * `ResponseOf` describes what the server sends, where every ownership field is present. A store
 * also holds rows the user is still creating, and those have none of them: `org`, `createdBy` and
 * the timestamps are assigned by the server on the first save. So the ownership fields are optional
 * here, `_id` stays required because the client mints it up front (`getObjectId`), and `isNew`
 * marks the row as a draft.
 *
 * `isNew` never reaches the API — `CLIENT_ONLY_KEYS` in `@repo/ui/lib` strips it from every request
 * body, and each app's `http.service.ts` applies that to everything it sends.
 *
 * ```ts
 * export type IStandard = ClientEntity<StandardDto>;
 * ```
 */
export type ClientEntity<T> = Omit<T, keyof BaseFields> &
  Partial<BaseFields> & {
    _id: string;
    /** True while the row exists only on the client and has never been saved. */
    isNew?: boolean;
  };
