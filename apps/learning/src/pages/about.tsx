import { Layout } from '@enums';
import { About } from '@modules/company';

function AboutPage() {
  return <About />;
}

AboutPage.layout = Layout.PUBLIC;

export default AboutPage;
