import { Card } from '@repo/ui/app';
import { PresignedImage } from '@components/app/attachments';
import { CourseInfo, StandardWithLogo } from '@components/common';
import { type ICourse, useStandardLookups, useSelectorLookups } from '@stores';
import Link from 'next/link';

interface IProps {
  course: ICourse;
}

export const CourseItem = ({ course }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { getStandardsByIds } = useStandardLookups();
  const { setSelectedCourseId } = selectorStore;

  const handleClick = () => {
    setSelectedCourseId(course._id);
  };

  return (
    <Card className="rounded border-2">
      <Link href={`/courses/${course._id}`} onClick={handleClick}>
        <div className="flex flex-col space-y-2 w-full">
          <div className="h-48 w-full">
            <PresignedImage className="rounded-t object-cover" url={(course.attachments ?? [])[0].url} noOpen />
          </div>
          <div className="p-3 flex flex-col space-y-3">
            <StandardWithLogo standard={getStandardsByIds(course.standards ?? [])[0]} />
            <div className="max-w-full">
              <div className="font-medium line-clamp-1">{course.name}</div>
              <div className="text-sm text-color-secondary line-clamp-1">{course.description}</div>
            </div>
            <div className="text-xs text-color-secondary">
              <CourseInfo courseStats={course.stats} />
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};
