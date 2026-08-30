import { Layout } from '@enums';
import { Workspace } from '@modules/workspace/Workspace';

const HomePage = () => {
  return (
    <div className="w-full">
      <Workspace />
    </div>
  );
};

HomePage.layout = Layout.SIDEBAR;

export default HomePage;
