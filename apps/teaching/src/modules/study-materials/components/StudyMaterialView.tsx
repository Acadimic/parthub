import { Attachments, type IAttachmentProps } from '@components/app/attachments';
import { Label } from '@repo/ui/app';
import { Html } from '@components/others';
import { type IMaterial } from '@stores';
import { ChapterName } from '@components/common/ChapterName';

interface IProps {
  material: IMaterial;
  otherAttachments?: IAttachmentProps[];
}

export const StudyMaterialView = ({ material, otherAttachments }: IProps) => {
  return (
    <div className="w-full">
      <div className="">
        <Html html={material.content} />
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {(material.attachments ?? []).length > 0 ? (
          <div>
            <Label label="Attachments" />
            <Attachments
              attachments={[
                ...(otherAttachments || []),
                ...material.attachments.map((attachment, index) => ({
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
