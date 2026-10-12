import { Layout } from '@enums';
import { Tickets } from '@modules/tickets';

function TicketsPage() {
  return <Tickets />;
}

TicketsPage.layout = Layout.SIDEBAR;

export default TicketsPage;
