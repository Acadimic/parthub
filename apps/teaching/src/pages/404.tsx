import { Button } from '@repo/ui/app';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { Layout } from '@enums';
import { useRouter } from 'next/router';

const FourOhFour = () => {
  const { push } = useRouter();

  return (
    <div className="flex justify-center items-center h-screen gap-y-6 px-8 md:px-4 bg-background">
      <div className="flex flex-col justify-center items-center gap-y-4">
        <div className="text-foreground font-bold text-4xl lg:text-5xl ">Page not found</div>
        <div className="text-center text-muted-foreground text-sm md:text-base font-medium">
          Uh oh, we can&#39;t seem to find the page you&#39;re looking for. The link you{' '}
          <br className="hidden md:block" />
          clicked may be broken or removed for our space.
        </div>
        <div>
          <Button
            text="Back"
            leftsection={<ArrowLeftIcon weight="bold" className="w-4 h-4" />}
            onClick={() => push('/')}
          />
        </div>
      </div>
    </div>
  );
};

FourOhFour.layout = Layout.NONE;

export default FourOhFour;
