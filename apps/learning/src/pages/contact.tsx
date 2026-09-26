import { Layout } from '@enums';
import { Contact } from '@modules/company';

function ContactPage() {
  return <Contact />;
}

ContactPage.layout = Layout.PUBLIC;

export default ContactPage;
