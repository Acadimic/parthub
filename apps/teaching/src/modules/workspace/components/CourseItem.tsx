import { type CourseDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';
import { CourseInfo, StandardWithLogo } from '@components/common';
import { ImageSquareIcon } from '@phosphor-icons/react';
import { Card } from '@repo/ui/app';
import { useSelectorLookups, useStandardLookups } from '@stores';
import Link from 'next/link';

interface IProps {
  course: CourseDto;
}

export const CourseItem = ({ course }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { getStandardsByIds } = useStandardLookups();
  const { setSelectedCourseId } = selectorStore;

  const handleClick = () => {
    setSelectedCourseId(course._id);
  };

  // A course with no attachments is normal — one is only added when the teacher uploads a cover.
  // Indexing [0] straight into `.url` threw a TypeError and took the whole home page down with it.
  const coverUrl = (course.attachments ?? [])[0]?.url;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border transition-colors hover:border-primary">
      <Link href={`/courses/${course._id}`} onClick={handleClick} className="flex h-full flex-col">
        <div className="h-40 w-full shrink-0 bg-muted">
          {coverUrl ? (
            <PresignedImage className="h-full w-full object-cover" url={coverUrl} noOpen />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageSquareIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <StandardWithLogo standard={getStandardsByIds(course.standards ?? [])[0]} />
          <div className="max-w-full">
            <div className="line-clamp-1 font-medium group-hover:text-primary">{course.name}</div>
            {course.description ? (
              <div className="line-clamp-1 text-sm text-muted-foreground">{course.description}</div>
            ) : null}
          </div>
          <div className="mt-auto text-xs text-muted-foreground">
            <CourseInfo courseStats={course.stats} />
          </div>
        </div>
      </Link>
    </Card>
  );
};
