import { Layout } from '@enums';
import { HelpCenter } from '@modules/company';

function HelpPage() {
  return <HelpCenter />;
}

HelpPage.layout = Layout.PUBLIC;

export default HelpPage;
