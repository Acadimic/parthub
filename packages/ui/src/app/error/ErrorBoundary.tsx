import Image from 'next/image';
import { Button } from '../buttons';

const resetAppState = () => {
  window.location.reload();
};

export function ErrorBoundaryFallback() {
  return (
    <div className="flex h-screen text-foreground">
      <div className="m-auto">
        <Image width={80} height={80} src="/images/alert-circle.svg" alt="error" className="m-auto" />
        <h1 className="m-auto font-bold text-xl text-center py-4">Oops! Something went wrong</h1>
        <h3 className="m-auto text-sm text-center py-2">
          Try refreshing the page and if it doesn&#39;t solve the issue, please email us at{' '}
          <a href="mailto:contact@parthhub.com" className="text-primary">
            contact@acadimic.com
          </a>
        </h3>
        <div className="flex justify-center items-center space-x-2 py-4">
          <Button text="Reload" onClick={resetAppState} />
        </div>
      </div>
    </div>
  );
}
