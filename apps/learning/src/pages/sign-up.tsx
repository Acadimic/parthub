import { Layout } from '@enums';
import { SignUp } from '@modules/auth';

function SignUpPage() {
  return <SignUp />;
}

SignUpPage.layout = Layout.AUTH;

export default SignUpPage;
