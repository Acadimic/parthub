import { ArrowsIn, ArrowsOut } from '@phosphor-icons/react';

interface IProps {
  setIsFullScreen: (isFullScreen: boolean) => void;
  isFullScreen: boolean;
}

export const ViewToolbar = ({ setIsFullScreen, isFullScreen }: IProps) => {
  return (
    <div className="absolute bottom-0 w-full h-8 z-[50] bg-background-primary border-t border-color-border">
      <div className="flex items-center justify-center h-full">
        <div
          className="px-4 flex items-center justify-center space-x-1 cursor-pointer hover:opacity-80 h-full"
          onClick={() => setIsFullScreen(!isFullScreen)}
        >
          {isFullScreen ? (
            <ArrowsIn weight="regular" className="w-6 h-6" />
          ) : (
            <ArrowsOut weight="regular" className="w-6 h-6" />
          )}
          <div className="opacity-100 text-sm font-semibold">Full Screen</div>
        </div>
      </div>
    </div>
  );
};
