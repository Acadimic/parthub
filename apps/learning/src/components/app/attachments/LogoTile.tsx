import { cn } from '@repo/ui/lib';
import { PresignedImage } from './PresignedImage';

type TileSize = 'sm' | 'md' | 'lg' | 'xl';

interface IProps {
  /** The stored logo address, or nothing — then the initial stands in. */
  url?: string | null;
  /** What the initial is taken from, and the accessible name of the tile. */
  name: string;
  size?: TileSize;
  className?: string;
}

const SIZE: Record<TileSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

/**
 * A standard's or subject's logo as a square tile, with the name's initial when there is none.
 *
 * Stays in the app rather than `@repo/ui` because `PresignedImage` signs the address through the
 * app's attachment hook. The support app carries the same component for the same reason.
 */
export const LogoTile = ({ url, name, size = 'md', className }: IProps) => {
  const initial = <span className="font-semibold text-muted-foreground">{name.trim().charAt(0).toUpperCase()}</span>;
  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted',
        url ? '' : 'border border-border',
        SIZE[size],
        className,
      )}
    >
      {url ? <PresignedImage url={url} noOpen fallback={initial} /> : initial}
    </div>
  );
};
