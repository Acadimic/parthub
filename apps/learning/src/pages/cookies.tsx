import { Layout } from '@enums';
import { Cookies } from '@modules/legal';

function CookiesPage() {
  return <Cookies />;
}

CookiesPage.layout = Layout.PUBLIC;

export default CookiesPage;
