/**
 * What a shared link's preview and a search engine read: a page that knows more than the site
 * default returns it from `getServerSideProps` as `meta`, and `_app` writes it into the head.
 */
export interface IPageMeta {
  title: string;
  description: string;
  /** An absolute URL; a link preview does not resolve a relative one. */
  image: string;
  /**
   * The page's own absolute address, for the canonical link and `og:url`. `null` on a page that is
   * built ahead of time, which only knows its route pattern (`/order/[code]`).
   */
  url: string | null;
  /** A schema.org description, already serialised as JSON-LD; `null` when the page has none. */
  jsonLd: string | null;
}
