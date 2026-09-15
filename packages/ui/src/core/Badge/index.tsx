import { Badge as ShadcnBadge } from '../../ui/badge';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'brand';
type BadgeAppearance = 'soft' | 'solid' | 'outline';

export interface IBadgeProps {
  children: React.ReactNode;
  /** Which token the pill is built from. `neutral` for a plain label, a status tone for a state. */
  tone?: BadgeTone;
  /** `soft` is a tinted fill, `solid` a filled block, `outline` a bordered label. Defaults to `soft`. */
  appearance?: BadgeAppearance;
  /** Renders a filled dot in the pill's tone. Use when the pill sits in a dense column and the
   *  colour alone has to be findable at a glance — colour is not available to every reader. */
  withDot?: boolean;
  className?: string;
}

export const Badge = ({ children, tone = 'neutral', appearance = 'soft', withDot, className }: IBadgeProps) => {
  return (
    <ShadcnBadge tone={tone} appearance={appearance} className={className}>
      {withDot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </ShadcnBadge>
  );
};

export type { BadgeTone, BadgeAppearance };
