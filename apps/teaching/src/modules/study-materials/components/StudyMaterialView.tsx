import { RichTextView } from '@repo/ui/content';
import { type MaterialDto } from '@repo/shared/contracts';
import { Attachments, type IAttachmentProps } from '@components/app/attachments';
import { Label } from '@repo/ui/app';
import { ChapterName } from '@components/common/ChapterName';

interface IProps {
  material: MaterialDto;
  otherAttachments?: IAttachmentProps[];
}

export const StudyMaterialView = ({ material, otherAttachments }: IProps) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <RichTextView
        value={material.content}
        fallback={<p className="text-sm text-muted-foreground">No written content.</p>}
      />
      <div className="flex flex-col gap-2">
        {(material.attachments ?? []).length > 0 ? (
          <div>
            <Label label="Attachments" />
            <Attachments
              attachments={[
                ...(otherAttachments ?? []),
                ...(material.attachments ?? []).map((attachment, index) => ({
                  fileName: attachment.fileName,
                  extension: attachment.fileExtension,
                  index,
                  url: attachment.url,
                  isStatic: attachment.isUploaded ? false : true,
                })),
              ]}
            />
          </div>
        ) : null}
      </div>
      <ChapterName chapterId={material.chapter} />
    </div>
  );
};
