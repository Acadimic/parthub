import { type AttachmentDto } from '@repo/shared/contracts';
import Link from 'next/link';

interface IProps {
  documentObject: AttachmentDto;
}

export const DocumentLink = ({ documentObject }: IProps) => {
  return (
    <div className="">
      <Link
        href={documentObject.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 truncate hover:underline max-w-12"
      >
        {documentObject.fileName}
      </Link>
    </div>
  );
};
