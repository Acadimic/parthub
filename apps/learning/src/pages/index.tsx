import { Layout } from '@enums';
import { Home } from '@modules/home';

function HomePage() {
  return <Home />;
}

HomePage.layout = Layout.PUBLIC;

export default HomePage;
