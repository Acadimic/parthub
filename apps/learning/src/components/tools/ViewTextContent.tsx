import { FullScreenModal } from '@parthhub/ui/app';
import { Html } from '@components/others';
import { useMemo, useState } from 'react';
import { ViewToolbar } from './ViewToolbar';

interface IProps {
  content: string;
  className?: string;
  isStatic?: boolean;
}

export const ViewTextContent = ({ content }: IProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const CONTENT = useMemo(() => {
    return (
      <>
        <div className="pt-6 pb-16 px-4">
          <Html html={content || 'No content available. Please check next tab. '} />
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
