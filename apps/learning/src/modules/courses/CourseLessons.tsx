import { isObjectId } from '@repo/shared/utils';
import { Course } from './Course';
import { CourseBySlug } from './CourseBySlug';

interface IProps {
  course: string;
}

/**
 * A course's lessons at /courses/<course>/modules. The app links here by id; a slug, as in an
 * address typed or edited by hand, is resolved first, because the course routes take only an id.
 */
export const CourseLessons = ({ course }: IProps) =>
  isObjectId(course) ? (
    <Course courseId={course} isPreview={false} />
  ) : (
    <CourseBySlug slug={course} isPreview={false} />
  );
