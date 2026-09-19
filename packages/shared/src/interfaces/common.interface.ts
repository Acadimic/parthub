export interface ISelectItem {
  label: string;
  value: string;
  description?: string;
  group?: string;
  color?: string;
  icon?: unknown;
}

export interface IDynamicObject {
  [key: string]: number;
}

/**
 * One object a client is asking for an upload URL for.
 *
 * `contentType` is the header the browser will send on the PUT, and S3 signs it into the URL: an
 * upload whose `Content-Type` differs from the one signed here is rejected by S3, not by the server.
 * The field names mirror `PresignedPutUrlDto` in the server's common module, which validates the
 * body with `forbidNonWhitelisted` — a client that sends `fileType` instead gets a 400.
 */
export interface IPresignedPutUrlRequest {
  key: string;
  contentType: string;
  /** Declared so the server can refuse a file over the limit before signing. */
  size?: number;
}

/** The body of `POST common/presigned-PUT-urls` and its `@Private()` twin. */
export interface IPresignedPutUrlsRequest {
  files: IPresignedPutUrlRequest[];
  isPublic?: boolean;
}

/**
 * The body of `POST common/presigned-GET-urls` and its `@Private()` twin.
 *
 * These are S3 object keys, not URLs: the server passes each one to `GetObjectCommand` unchanged.
 * A caller holding a stored attachment URL has to reduce it to its key first.
 */
export interface IPresignedGetUrlsRequest {
  keys: string[];
  isPublic?: boolean;
}

export interface IStandardSubjectQuery {
  standard: string;
  subject: string;
}
