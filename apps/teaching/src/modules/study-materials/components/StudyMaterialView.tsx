import { RichTextView } from '@repo/ui/content';
import { type AttachmentDto, type MaterialDto } from '@repo/shared/contracts';
import { Attachments } from '@components/app/attachments';
import { Label } from '@repo/ui/app';
import { ChapterName } from '@components/common/ChapterName';
import { useFullMaterial } from '@hooks/full-material.hook';

interface IProps {
  material: MaterialDto;
  /** Attachments not yet on the material, such as files staged in the form that shows this preview. */
  otherAttachments?: AttachmentDto[];
}

export const StudyMaterialView = ({ material, otherAttachments }: IProps) => {
  const { isFull, isFailed } = useFullMaterial(material._id);
  const attachments = [...(otherAttachments ?? []), ...(material.attachments ?? [])];

  const renderBody = () => {
    if (isFull) {
      return (
        <RichTextView
          value={material.content}
          fallback={<p className="text-sm text-muted-foreground">No written content.</p>}
        />
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        {isFailed ? 'Could not load this content. Close and open it again to retry.' : 'Loading content…'}
      </p>
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {renderBody()}
      {attachments.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label label="Attachments" />
          <Attachments attachments={attachments} />
        </div>
      ) : null}
      <ChapterName chapterId={material.chapter} />
    </div>
  );
};
