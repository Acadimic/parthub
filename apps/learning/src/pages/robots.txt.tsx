import { getRobotsProps } from '@utils/helpers';

// The response is written whole by getServerSideProps; nothing renders.
const RobotsPage = () => null;

export default RobotsPage;

export const getServerSideProps = getRobotsProps;
