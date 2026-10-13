import { type AttachmentDto } from '@repo/shared/contracts';
import { Menu, Tooltip } from '@repo/ui/app';
import { type IMenuItem } from '@repo/ui/types';
import { useAttachment } from '@hooks/attachment.hook';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { getAttachmentIcon } from '@components/app/attachments';
import { BookOpenTextIcon, DotsThreeIcon } from '@phosphor-icons/react';
import { type IMaterial, useSelectorLookups } from '@stores';

/**
 * The lesson's sources as entries of the ⋯ menu: the body, then each attachment. In the topic
 * reader an entry moves to that page; in the full view it swaps the frame's content. Only a
 * lesson with attachments lists them — a body alone has nothing to switch between.
 */
const useSourceMenuItems = (material: IMaterial): IMenuItem[] => {
  const { selectedContent, selectedAttachment, setSelectedContent, removeSelectedAttachment } = useSelectorLookups();
  const { handleClickAttachment } = useAttachment();
  const reader = useLessonReader(material);
  const readerPage = reader.isReader ? reader.page : undefined;

  const onClickContent = () => {
    if (reader.isReader) return reader.goToPage(0);
    setSelectedContent(material.content ?? null);
    removeSelectedAttachment();
  };

  const onClickAttachment = (attachment: AttachmentDto) => {
    if (!reader.isReader) return handleClickAttachment(attachment);
    const index = reader.pages.findIndex((page) => page.kind === 'attachment' && page.key === attachment.key);
    if (index !== -1) reader.goToPage(index);
  };

  const getSelectedAttachmentKey = () => {
    if (!readerPage) return selectedAttachment?.key;
    return readerPage.kind === 'attachment' ? readerPage.key : undefined;
  };

  const attachments = material.attachments ?? [];
  if (!attachments.length) return [];
  const hasSelectedContent = readerPage ? readerPage.kind === 'section' : Boolean(selectedContent);
  const selectedAttachmentKey = getSelectedAttachmentKey();
  return [
    {
      label: 'Lesson',
      icon: <BookOpenTextIcon weight="bold" className="h-4 w-4" />,
      isCurrent: hasSelectedContent,
      onClick: onClickContent,
    },
    ...attachments.map((attachment): IMenuItem => ({
      label: attachment.fileName,
      // The same icon the chip row gave it: the red YouTube mark, the PDF, the picture, the link.
      icon: getAttachmentIcon(attachment.fileExtension, attachment.url),
      isCurrent: selectedAttachmentKey === attachment.key,
      onClick: () => onClickAttachment(attachment),
    })),
  ];
};

/**
 * The lesson's sources behind a ⋯ of their own at the end of the progress strip, so they are
 * reachable in both views and in full screen. Nothing for a lesson that is a body alone.
 */
export const SourcesMenu = ({ material }: { material: IMaterial }) => {
  const menuItems = useSourceMenuItems(material);
  if (!menuItems.length) return null;
  return (
    <Tooltip title="Lesson and attachments">
      <Menu
        menuItems={menuItems}
        className="px-0"
        component={
          <span
            role="button"
            aria-label="Lesson and attachments"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <DotsThreeIcon weight="bold" className="h-5 w-5" />
          </span>
        }
      />
    </Tooltip>
  );
};
