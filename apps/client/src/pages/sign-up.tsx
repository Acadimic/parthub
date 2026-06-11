import { SignUp } from '@modules/auth';

const SignUpPage = () => <SignUp />;

(SignUpPage as any).layout = 'auth';
export default SignUpPage;
