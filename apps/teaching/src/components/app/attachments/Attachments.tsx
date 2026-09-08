import { Attachment, type IAttachmentProps } from './Attachment';

interface IProps {
  attachments: IAttachmentProps[];
}

export const Attachments = ({ attachments }: IProps) => {
  return (
    <div className="flex w-full items-center justify-start gap-1.5 flex-wrap max-w-full">
      {attachments.map((props: IAttachmentProps) => {
        return <Attachment key={props.index} {...props} />;
      })}
    </div>
  );
};
