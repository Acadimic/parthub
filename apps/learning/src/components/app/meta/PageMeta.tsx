import { type IPageMeta } from '@interfaces';
import Head from 'next/head';

interface IProps {
  meta: IPageMeta;
}

/** Google Search Console's ownership proof for an "HTML tag" property; unset leaves the tag out. */
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

/**
 * The title, description and Open Graph tags a browser tab and a shared link's preview read, plus
 * the canonical address and structured data a search engine reads where the page knows them.
 */
export const PageMeta = ({ meta }: IProps) => (
  <Head>
    <title>{meta.title}</title>
    <meta name="viewport" content="initial-scale=1, width=device-width" />
    <meta name="description" content={meta.description} />
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
    {GOOGLE_SITE_VERIFICATION ? <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} /> : null}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Acadimic" />
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={meta.description} />
    {meta.url ? <link rel="canonical" href={meta.url} /> : null}
    {meta.url ? <meta property="og:url" content={meta.url} /> : null}
    <meta property="og:image" content={meta.image} />
    <meta property="og:image:alt" content={meta.title} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={meta.title} />
    <meta name="twitter:description" content={meta.description} />
    <meta name="twitter:image" content={meta.image} />
    {meta.jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: meta.jsonLd }} /> : null}
  </Head>
);
