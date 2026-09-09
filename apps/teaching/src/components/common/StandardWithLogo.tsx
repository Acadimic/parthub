import { type StandardDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';

interface IProps {
  standard: StandardDto | undefined;
}

export const StandardWithLogo = ({ standard }: IProps) => {
  if (!standard?.logo) return null;

  return (
    <div className="flex justify-start items-center space-x-2">
      <div className="w-10 h-10 border border-color-border p-1 rounded">
        <PresignedImage url={standard.logo} noOpen />
      </div>
      <div className="flex-1">
        <div className="text-wrap line-clamp-2 text-xs text-color-secondary font-medium">{standard.name}</div>
      </div>
    </div>
  );
};
