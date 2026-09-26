import { Layout } from '@enums';
import { Terms } from '@modules/legal';

function TermsPage() {
  return <Terms />;
}

TermsPage.layout = Layout.PUBLIC;

export default TermsPage;
