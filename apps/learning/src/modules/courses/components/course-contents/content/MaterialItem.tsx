import { VideoPlayer, ViewTextContent, ViewUrlContent } from '@components/tools';
import { DocumentType, LinkType } from '@enums';
import { type IMaterial, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

interface IProps {
  material: IMaterial;
}

export const MaterialItem = observer(({ material }: IProps) => {
  const { selectorStore } = useStores();
  const { selectedContent, selectedAttachment, setSelectedContent, removeSelectedAttachment } = selectorStore;

  useEffect(() => {
    const isMaterialAttachment = material.attachments.some((attachment) => attachment._id === selectedAttachment?._id);
    if (!isMaterialAttachment) {
      setSelectedContent(material.content);
      removeSelectedAttachment();
    }
  }, [selectedAttachment?._id, material?._id]);

  const getAttachmentItem = () => {
    if (selectedContent) return <ViewTextContent content={selectedContent} />;
    if (!selectedAttachment) return null;
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
});
