import { Layout } from '@enums';
import { AccountSettings } from '@modules/user';

function PurchasesPage() {
  return <AccountSettings />;
}

PurchasesPage.layout = Layout.PAGE_NAVIGATION;

export default PurchasesPage;
