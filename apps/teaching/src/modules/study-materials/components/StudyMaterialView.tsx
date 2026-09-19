import { RichTextView } from '@repo/ui/content';
import { type AttachmentDto, type MaterialDto } from '@repo/shared/contracts';
import { Attachments } from '@components/app/attachments';
import { Label } from '@repo/ui/app';
import { ChapterName } from '@components/common/ChapterName';

interface IProps {
  material: MaterialDto;
  /** Attachments not yet on the material, such as files staged in the form that shows this preview. */
  otherAttachments?: AttachmentDto[];
}

export const StudyMaterialView = ({ material, otherAttachments }: IProps) => {
  const attachments = [...(otherAttachments ?? []), ...(material.attachments ?? [])];
  return (
    <div className="flex w-full flex-col gap-4">
      <RichTextView
        value={material.content}
        fallback={<p className="text-sm text-muted-foreground">No written content.</p>}
      />
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
