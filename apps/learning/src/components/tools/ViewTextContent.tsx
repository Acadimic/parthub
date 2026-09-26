import { FullScreenModal } from '@repo/ui/app';
import { RichTextView } from '@repo/ui/content';
import { type IRichText } from '@repo/shared/interfaces';
import { useMemo } from 'react';
import { FullScreenBar } from './FullScreenBar';

interface IProps {
  content?: IRichText | null;
  /** Owned by the frame around the viewer, whose toolbar carries the toggle. */
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

export const ViewTextContent = ({ content, isFullScreen, onFullScreenChange }: IProps) => {
  const CONTENT = useMemo(
    () => (
      <div className="px-4 pb-10 pt-6 md:px-8">
        <RichTextView value={content} fallback="No content available. Please check next tab." />
      </div>
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
          <div className="flex h-full w-full flex-col">
            <FullScreenBar onExit={() => onFullScreenChange(false)} />
            <div className="mx-auto w-full max-w-4xl flex-1 overflow-auto">{CONTENT}</div>
          </div>
        }
      />
    </div>
  );
};
