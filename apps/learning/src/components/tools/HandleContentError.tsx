import { Link } from '@repo/ui/app';
import Image from 'next/image';

interface IProps {
  url: string;
}

export const HandleContentError = ({ url }: IProps) => {
  const openUrl = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-background-primary">
      <div className="m-auto">
        <Image width={80} height={80} src="/images/alert-circle.svg" alt="error" className="m-auto" />
        <h1 className="m-auto font-bold text-xl text-center py-4">Oops! Something went wrong</h1>
        <h3 className="m-auto text-sm text-center py-2">
          We could not open the link. Please open it manually in a new tab.
        </h3>
        <div className="flex justify-center items-center space-x-2 py-4">
          <Link target="_blank" href={url} onClick={openUrl}>
            Open
          </Link>
        </div>
      </div>
    </div>
  );
};
