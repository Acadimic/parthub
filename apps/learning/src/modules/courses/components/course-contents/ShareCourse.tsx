import { ShareFatIcon } from '@phosphor-icons/react';

interface IProps {
  courseId: string;
}

// The share action is not implemented yet; `courseId` is the identifier it will need.
export const ShareCourse = (_props: IProps) => {
  return (
    <div className="cursor-pointer flex items-center space-x-2 rounded-full bg-color-light border border-color-border py-1.5 px-4">
      <ShareFatIcon weight="bold" className="h-5 w-5" />
      <div className="text-sm font-medium pr-1">Share</div>
    </div>
  );
};
