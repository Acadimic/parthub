import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { getCoursePagePaths, getCourseIdPageProps } from '@utils/helpers';
import { useRouter } from 'next/router';

const CoursePreviewPage = () => {
  const { query } = useRouter();

  return <Course courseId={query.course as string} isPreview={true} />;
};

CoursePreviewPage.layout = Layout.PUBLIC;

export default CoursePreviewPage;

// Built per course and cached, for the link preview and a canonical link to the slug address.
export const getStaticProps = getCourseIdPageProps;
export const getStaticPaths = getCoursePagePaths;
