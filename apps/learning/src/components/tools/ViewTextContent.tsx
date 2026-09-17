import { FullScreenModal } from '@repo/ui/app';
import { type IRichText } from '@repo/shared/interfaces';
import { RichTextContent } from '@repo/ui/core';
import { useMemo, useState } from 'react';
import { ViewToolbar } from './ViewToolbar';

interface IProps {
  content?: IRichText | null;
  className?: string;
  isStatic?: boolean;
}

export const ViewTextContent = ({ content }: IProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const CONTENT = useMemo(() => {
    return (
      <>
        <div className="pt-6 pb-16 px-4">
          <RichTextContent value={content} fallback="No content available. Please check next tab." />
        </div>
      </>
    );
  }, [content]);

  return (
    <div className="w-full h-full overflow-auto">
      <>
        <ViewToolbar setIsFullScreen={setIsFullScreen} isFullScreen={isFullScreen} />
      </>
      {CONTENT}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        component={
          <div className="w-full h-full">
            <ViewToolbar setIsFullScreen={setIsFullScreen} isFullScreen={isFullScreen} />
            {CONTENT}
          </div>
        }
      />
    </div>
  );
};
