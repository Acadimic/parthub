import { Loader } from '@repo/ui/app';
import { BlankState } from '@components/others';
import { VideoPlayer, ViewTextContent, ViewUrlContent } from '@components/tools';
import { DocumentType, LinkType } from '@enums';
import { type IMaterial, useSelectorLookups } from '@stores';
import { useEffect } from 'react';

interface IProps {
  material: IMaterial;
}

export const MaterialItem = ({ material }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { selectedContent, selectedAttachment, setSelectedContent, removeSelectedAttachment } = selectorStore;

  useEffect(() => {
    const isMaterialAttachment = (material.attachments ?? []).some(
      (attachment) => attachment.key === selectedAttachment?.key,
    );
    if (!isMaterialAttachment) {
      setSelectedContent(material.content ?? null);
      removeSelectedAttachment();
    }
  }, [selectedAttachment?.key, material?._id]);

  const hasLesson = Boolean(material.content) || Boolean(material.attachments?.length);

  const getAttachmentItem = () => {
    if (!hasLesson) {
      return (
        <BlankState
          className="h-full justify-center"
          label="Nothing here yet"
          description="This lesson has no written content or attachments."
        />
      );
    }
    if (selectedContent) return <ViewTextContent content={selectedContent} />;
    // The effect above picks what to show after the first paint; until then, a spinner.
    if (!selectedAttachment) return <Loader isLoading />;
    if (selectedAttachment?.documentType === DocumentType.FILE && selectedAttachment.isUploaded) {
      return <ViewUrlContent url={selectedAttachment.url} isStatic={!selectedAttachment.isUploaded} />;
    }
    if (
      selectedAttachment?.documentType === DocumentType.LINK &&
      !selectedAttachment.isUploaded &&
      selectedAttachment.linkType &&
      [LinkType.YOUTUBE, LinkType.VIDEO].includes(selectedAttachment.linkType)
    ) {
      return <VideoPlayer url={selectedAttachment.url} isStatic={true} />;
    }
    return <ViewUrlContent url={selectedAttachment.url} isStatic={!selectedAttachment.isUploaded} />;
  };

  return (
    <>
      <div className="w-full h-full">{getAttachmentItem()}</div>
    </>
  );
};
