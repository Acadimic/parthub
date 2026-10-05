import { getSitemapProps } from '@utils/helpers';

// The response is written whole by getServerSideProps; nothing renders.
const SitemapPage = () => null;

export default SitemapPage;

export const getServerSideProps = getSitemapProps;
