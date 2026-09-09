import { useAttachment } from '@hooks/attachment.hook';
import { getRandomColor } from '@utils/helpers';
import { useEffect, useState } from 'react';
import { Tooltip } from '@repo/ui/app';

interface IProps {
  id: string;
  name: string;
  avatar?: string | null;
  size?: number;
  bg?: string;
  color?: string;
  className?: string;
  isStatic?: string;
}

export const Avatar = ({ id, name, avatar, size = 32, bg: bgProp, color: colorProp, className, isStatic }: IProps) => {
  const randomColor = getRandomColor(id);
  const bg = bgProp || randomColor.bg;
  const color = colorProp || randomColor.color;
  const splitNames = name.split(' ');
  const { getPresignedUrls } = useAttachment();
  const [presignedUrl, setPresignedUrl] = useState<string>('');

  const fetchAndSetPresignedUrl = async () => {
    if (!avatar) return;
    const urls = await getPresignedUrls([avatar]);
    urls.length > 0 && setPresignedUrl(urls[0]);
  };

  useEffect(() => {
    if (avatar && isStatic) setPresignedUrl(avatar);
    else if (!presignedUrl) fetchAndSetPresignedUrl();
  }, [avatar]);

  const initials = `${splitNames[0][0]}${splitNames[1] ? splitNames[1][0] : ''}`;

  return (
    <div
      className={`uppercase text-sm font-medium border border-color-border rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${className || ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: presignedUrl ? 'transparent' : bg,
        color,
      }}
    >
      {presignedUrl ? (
        <img src={presignedUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Tooltip title={name}>{initials}</Tooltip>
      )}
    </div>
  );
};
