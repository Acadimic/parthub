import { Layout } from '@enums';
import { Calender } from '@modules/calender';

function CalenderPage() {
  return <Calender />;
}

CalenderPage.layout = Layout.SIDEBAR;

export default CalenderPage;
