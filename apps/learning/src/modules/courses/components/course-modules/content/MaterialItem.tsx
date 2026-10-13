import { Loader } from '@repo/ui/app';
import { BlankState } from '@components/others';
import { ViewTextContent } from '@components/tools';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { type IMaterial, useSelectorLookups } from '@stores';
import { useEffect } from 'react';
import { AttachmentContent } from './AttachmentContent';
import { TopicReader } from './TopicReader';

interface IProps {
  material: IMaterial;
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

export const MaterialItem = ({ material, isFullScreen, onFullScreenChange }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { selectedContent, selectedAttachment, setSelectedContent, removeSelectedAttachment } = selectorStore;
  const { isReader } = useLessonReader(material);

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
    if (isReader) {
      return <TopicReader material={material} isFullScreen={isFullScreen} onFullScreenChange={onFullScreenChange} />;
    }
    if (selectedContent) {
      return (
        <ViewTextContent
          content={selectedContent}
          isFullScreen={isFullScreen}
          onFullScreenChange={onFullScreenChange}
        />
      );
    }
    // The effect above picks what to show after the first paint; until then, a spinner.
    if (!selectedAttachment) return <Loader isLoading />;
    return (
      <AttachmentContent
        attachment={selectedAttachment}
        isFullScreen={isFullScreen}
        onFullScreenChange={onFullScreenChange}
      />
    );
  };

  return (
    <>
      <div className="w-full h-full">{getAttachmentItem()}</div>
    </>
  );
};
