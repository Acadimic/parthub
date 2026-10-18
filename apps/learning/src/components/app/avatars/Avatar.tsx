import { useAttachment } from '@hooks/attachment.hook';
import { getRandomColor } from '@utils/helpers';
import { useEffect, useState } from 'react';
import { Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';

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
  // The initials stay underneath, and the photo fades in over them once it has downloaded.
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => setIsLoaded(false), [presignedUrl]);

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
      className={`relative uppercase text-sm font-medium border border-border rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${className || ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color,
      }}
    >
      <Tooltip title={name}>{initials}</Tooltip>
      {presignedUrl ? (
        <img
          src={presignedUrl}
          alt={name}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => setIsLoaded(true)}
          // A dead address — an object removed from the bucket, a provider photo that no longer
          // resolves — shows the initials rather than the browser's broken-image box.
          onError={() => setPresignedUrl('')}
        />
      ) : null}
    </div>
  );
};
