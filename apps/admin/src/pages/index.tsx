import { FullScreenLoader } from '@parthhub/ui/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Index = () => {
  const { push } = useRouter();

  useEffect(() => {
    push('/home');
  }, []);

  return <FullScreenLoader loading />;
};

export default Index;
