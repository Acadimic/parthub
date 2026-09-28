import { Layout } from '@enums';
import { Orders } from '@modules/orders';

function OrdersPage() {
  return <Orders />;
}

OrdersPage.layout = Layout.SIDEBAR;

export default OrdersPage;
