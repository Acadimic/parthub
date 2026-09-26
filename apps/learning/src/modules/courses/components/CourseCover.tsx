import { cn } from '@repo/ui/lib';
import { PresignedImage } from '@components/app/attachments';
import { type ICourse } from '@stores';

/** Five fills for a course without a cover, picked by id so a course keeps its colour. */
const COVER_FILLS = [
  'from-chart-1 to-chart-1/70',
  'from-chart-2 to-chart-2/70',
  'from-chart-3 to-chart-3/70',
  'from-chart-4 to-chart-4/70',
  'from-chart-5 to-chart-5/70',
];

const getCoverFill = (id: string) => {
  const sum = Array.from(id).reduce((total, char) => total + char.charCodeAt(0), 0);
  return COVER_FILLS[sum % COVER_FILLS.length];
};

/** The course name over a coloured field, standing in for a cover that was never uploaded. */
const CoverFallback = ({ course }: { course: ICourse }) => (
  <div
    className={cn(
      'flex h-full w-full items-end bg-gradient-to-br p-4 text-primary-foreground',
      getCoverFill(course._id),
    )}
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-4 -top-6 select-none font-mono text-[9rem] font-bold leading-none opacity-15"
    >
      {course.name.trim().charAt(0).toUpperCase()}
    </span>
    <span className="relative line-clamp-2 text-lg font-semibold leading-tight">{course.name}</span>
  </div>
);

interface IProps {
  course: ICourse;
  /** Classes for the image itself, such as a hover scale; the frame is the caller's. */
  imageClassName: string;
}

/**
 * A course's cover: the first attachment when there is one, otherwise the same coloured field
 * the catalogue cards show, so a course looks the same wherever it appears. Fills its frame;
 * the caller sets the aspect ratio and `relative overflow-hidden`.
 */
export const CourseCover = ({ course, imageClassName }: IProps) => {
  const cover = (course.attachments ?? [])[0]?.url ?? null;
  if (!cover) return <CoverFallback course={course} />;
  return (
    <PresignedImage
      url={cover}
      noOpen
      className={cn('h-full w-full object-cover', imageClassName)}
      fallback={<CoverFallback course={course} />}
    />
  );
};
