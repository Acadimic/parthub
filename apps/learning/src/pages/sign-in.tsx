import { Layout } from '@enums';
import { SignIn } from '@modules/auth';

function SignInPage() {
  return <SignIn />;
}

SignInPage.layout = Layout.AUTH;

export default SignInPage;
