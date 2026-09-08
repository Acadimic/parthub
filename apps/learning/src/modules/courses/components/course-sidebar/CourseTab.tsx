import { type CourseItemType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { observer } from 'mobx-react-lite';

interface IProps {
  courseTab: CourseItemType;
}

export const CourseTab = observer(({ courseTab }: IProps) => {
  const { onSelectCourseItem, selectedCourseItem } = useCourse();
  const selectedClass = `border-blue-primary bg-color-light`;
  const notSelectedClass = `border-transparent bg-transparent`;
  const infoClass = `w-full text-sm font-medium flex items-center space-x-2 capitalize cursor-pointer py-4 px-4 border-l-[3px] ${selectedClass}`;

  return (
    <div
      className={`${infoClass} ${selectedCourseItem === courseTab ? selectedClass : notSelectedClass}`}
      onClick={() => onSelectCourseItem(courseTab)}
    >
      {courseTab}
    </div>
  );
});
