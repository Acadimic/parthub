import { Layout } from '@enums';
import { OrderCheckout } from '@modules/orders';
import { useRouter } from 'next/router';

function OrderPage() {
  const { query } = useRouter();
  const code = typeof query.code === 'string' ? query.code : '';
  return code ? <OrderCheckout code={code} /> : null;
}

OrderPage.layout = Layout.PUBLIC;

export default OrderPage;
