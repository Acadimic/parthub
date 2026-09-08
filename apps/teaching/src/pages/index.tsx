import { FullScreenLoader } from '@parthhub/ui/app';
import { Layout } from '@enums';
import { getFirebaseUser } from '@utils/firebase';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Index = () => {
  const { push } = useRouter();

  useEffect(() => {
    const firebaseUser = getFirebaseUser();
    if (firebaseUser) push('/home');
    else push('/sign-in');
  }, []);

  return <FullScreenLoader loading />;
};

Index.layout = Layout.NONE;

export default Index;
