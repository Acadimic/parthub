import { Button } from '@repo/ui/app';
import { ArrowsInIcon } from '@phosphor-icons/react';

/** The one control a full-screen viewer needs: the way back out. */
export const FullScreenBar = ({ onExit }: { onExit: () => void }) => (
  <div className="flex h-12 shrink-0 items-center justify-end border-b border-border bg-background px-3">
    <Button
      isSecondary
      className="px-3 py-1.5"
      onClick={onExit}
      leftsection={<ArrowsInIcon weight="bold" className="h-4 w-4" />}
    >
      Exit full screen
    </Button>
  </div>
);
