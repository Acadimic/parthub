/**
 * One presigned S3 URL and the object key it was issued for.
 *
 * Returned as an array by all four presigned routes in the server's common module —
 * `POST common/presigned-PUT-urls`, `common/presigned-GET-urls`, and their `@Private()` twins
 * `common/private-presigned-PUT-urls` and `common/private-presigned-GET-urls`.
 *
 * The key travels with the URL so a caller can pair a signed URL back to the object it asked for
 * without relying on array position. That matters because a presigned URL carries its own query
 * string, so the URL alone no longer tells you which key it belongs to.
 *
 * **The three apps do not consume this shape today.** Their `common.service.ts` declares the
 * response as `string[]` and their `attachment.hook.ts` uses each element as a bare URL string
 * (`presignedUrls[index].split('?')[0]`), which would be `undefined` against the real payload. The
 * request side disagrees too: the apps post `{ keys: [{ key, fileType }] }` while
 * `PresignedPutUrlsDto` declares `{ files: [{ key, contentType }] }`. Whoever aligns the two should
 * change the clients to this shape rather than flatten the server's, or the key is lost.
 */
export interface IPresignedUrl {
  key: string;
  url: string;
}
