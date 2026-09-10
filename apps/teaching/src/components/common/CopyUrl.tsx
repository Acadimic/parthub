import { Tooltip } from '@repo/ui/app';
import { CopyIcon } from '@phosphor-icons/react';
import { successToast } from '@utils/helpers';

interface IProps {
  url: string;
  isCopyIconOnly?: boolean;
}

export const CopyUrl = ({ url, isCopyIconOnly = false }: IProps) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    successToast({ message: 'URL copied to clipboard successfully.' });
  };

  return (
    <div className="flex items-center gap-2 cursor-pointer justify-between" onClick={handleCopyLink}>
      <Tooltip title="Copy">
        <CopyIcon className="w-6 h-6" />
      </Tooltip>
      {isCopyIconOnly ? null : (
        <div className="text-xs text-primary !font-normal flex flex-col">
          <div className="font-medium">Copy Link</div>
          <div className="text-xxs text-primary !font-normal italic max-w-28 md:max-w-52 truncate">{url}</div>
        </div>
      )}
    </div>
  );
};
