import { type IAttachment } from '@stores';
import Link from 'next/link';

interface IProps {
  documentObject: IAttachment;
}

export const DocumentLink = ({ documentObject }: IProps) => {
  return (
    <div className="">
      <Link
        href={documentObject.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary truncate hover:underline max-w-12"
      >
        {documentObject.fileName}
      </Link>
    </div>
  );
};
