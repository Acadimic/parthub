import { type AttachmentDto } from '@repo/shared/contracts';
import { ArrowSquareOutIcon, DownloadSimpleIcon, LinkSimpleIcon } from '@phosphor-icons/react';
import { Button, Modal } from '@repo/ui/app';
import { Spinner } from '@repo/ui/core';
import { FileExtension, PositionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { useEffect, useState } from 'react';

interface IProps {
  attachment: AttachmentDto | null;
  onClose: () => void;
}

const IMAGE_EXTENSIONS: FileExtension[] = [FileExtension.PNG, FileExtension.JPG, FileExtension.JPEG];

/**
 * Looks at an attachment without leaving the page: a PDF in a frame, an image inline, anything
 * else as a card. Download and open-in-tab stay one click away for what a frame cannot show.
 */
export const FileViewerModal = ({ attachment, onClose }: IProps) => {
  const { getPresignedUrls } = useAttachment();
  const [signedUrl, setSignedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!attachment) return undefined;
    // A link needs no signing; an uploaded file does, and a slow answer for the previous file
    // must not land on this one.
    let isCurrent = true;
    setSignedUrl('');
    if (!attachment.isUploaded) {
      setSignedUrl(attachment.url);
      return undefined;
    }
    setIsLoading(true);
    getPresignedUrls([attachment.url])
      .then(([url]) => {
        if (isCurrent) setSignedUrl(url ?? '');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [attachment?.key, attachment?.url]);

  if (!attachment) return null;
  const isImage = IMAGE_EXTENSIONS.includes(attachment.fileExtension);
  const isPdf = attachment.fileExtension === FileExtension.PDF;

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      );
    }
    if (!signedUrl) {
      return <p className="py-10 text-center text-sm text-muted-foreground">This file could not be opened.</p>;
    }
    if (isPdf) {
      return (
        <iframe
          title={attachment.fileName}
          src={signedUrl}
          className="h-[70vh] w-full rounded-lg border border-border bg-muted"
        />
      );
    }
    if (isImage) {
      return (
        <img
          src={signedUrl}
          alt={attachment.fileName}
          className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain"
        />
      );
    }
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LinkSimpleIcon weight="bold" className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-foreground">{attachment.fileName}</p>
        <p className="max-w-full truncate text-xs text-muted-foreground">{attachment.url}</p>
      </div>
    );
  };

  return (
    <Modal
      isOpen={!!attachment}
      onClose={onClose}
      position={PositionType.TOP}
      className="w-[calc(100%-2rem)] md:w-[56rem]"
      title={attachment.fileName}
      description={attachment.isUploaded ? attachment.fileType || attachment.fileExtension : 'Link'}
      component={renderBody()}
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          {attachment.isUploaded && signedUrl ? (
            <Button
              isSecondary
              text="Download"
              leftsection={<DownloadSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={() => window.open(signedUrl, '_blank', 'noopener')}
            />
          ) : null}
          <Button
            text="Open in new tab"
            leftsection={<ArrowSquareOutIcon weight="bold" className="h-4 w-4" />}
            onClick={() => signedUrl && window.open(signedUrl, '_blank', 'noopener')}
            disabled={!signedUrl}
          />
        </div>
      }
    />
  );
};
