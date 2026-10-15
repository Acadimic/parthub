import { FullScreenModal } from '@repo/ui/app';
import { RichTextView } from '@repo/ui/content';
import { type IRichText } from '@repo/shared/interfaces';
import { useMemo } from 'react';
import { CenteredOnce } from './CenteredOnce';
import { FullScreenBar } from './FullScreenBar';
import { FullScreenStrip } from './FullScreenStrip';

interface IProps {
  content?: IRichText | null;
  /** Owned by the frame around the viewer, whose toolbar carries the toggle. */
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

export const ViewTextContent = ({ content, isFullScreen, onFullScreenChange }: IProps) => {
  const CONTENT = useMemo(
    () => (
      // A short topic sits in the middle of the frame rather than at the top of an empty one; a long
      // one fills the frame and scrolls as before.
      <CenteredOnce key={content?.text ?? ''} className="px-4 pb-10 pt-6 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <RichTextView value={content} fallback="No content available. Please check next tab." />
        </div>
      </CenteredOnce>
    ),
    [content],
  );

  return (
    <div className="h-full w-full overflow-auto">
      {CONTENT}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => onFullScreenChange(false)}
        component={
          <div className="flex h-full w-full flex-col" data-reader-surface="">
            <FullScreenStrip />
            <div className="min-h-0 w-full flex-1 overflow-auto">
              <div className="mx-auto h-full w-full max-w-4xl">{CONTENT}</div>
            </div>
            <FullScreenBar onExit={() => onFullScreenChange(false)} />
          </div>
        }
      />
    </div>
  );
};
