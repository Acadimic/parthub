import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { useRouter } from 'next/router';

const CoursePage = () => {
  const router = useRouter();
  return <Course courseId={router.query._id as string} />;
};

CoursePage.layout = Layout.SIDEBAR;

export default CoursePage;
