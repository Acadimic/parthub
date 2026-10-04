import { type IPageMeta } from '@interfaces';
import Head from 'next/head';

interface IProps {
  meta: IPageMeta;
}

/**
 * The title, description and Open Graph tags a browser tab and a shared link's preview read. No
 * `og:url` or canonical: a statically built dynamic route only knows its pattern (`/order/[code]`),
 * and a preview falls back to the address it fetched, which is always right.
 */
export const PageMeta = ({ meta }: IProps) => (
  <Head>
    <title>{meta.title}</title>
    <meta name="viewport" content="initial-scale=1, width=device-width" />
    <meta name="description" content={meta.description} />
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Acadimic" />
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={meta.description} />
    <meta property="og:image" content={meta.image} />
    <meta property="og:image:alt" content={meta.title} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={meta.title} />
    <meta name="twitter:description" content={meta.description} />
    <meta name="twitter:image" content={meta.image} />
  </Head>
);
