import { SignIn } from '@modules/auth';

const SignInPage = () => <SignIn />;

(SignInPage as any).layout = 'auth';
export default SignInPage;
