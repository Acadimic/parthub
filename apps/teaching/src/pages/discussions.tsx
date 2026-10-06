import { Layout } from '@enums';
import { Discussions } from '@modules/discussions';

const DiscussionsPage = () => {
  return <Discussions />;
};

DiscussionsPage.layout = Layout.SIDEBAR;

export default DiscussionsPage;
