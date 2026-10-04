/**
 * What a shared link's preview shows: a page that knows more than the site default returns it from
 * `getServerSideProps` as `meta`, and `_app` writes it into the head the crawler reads.
 */
export interface IPageMeta {
  title: string;
  description: string;
  /** An absolute URL; a link preview does not resolve a relative one. */
  image: string;
}
