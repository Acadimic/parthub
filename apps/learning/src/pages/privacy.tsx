import { Layout } from '@enums';
import { Privacy } from '@modules/legal';

function PrivacyPage() {
  return <Privacy />;
}

PrivacyPage.layout = Layout.PUBLIC;

export default PrivacyPage;
