import { useCourse } from '@hooks/course.hook';
import { Check, Circle } from '@phosphor-icons/react';
import { ICourseModule, useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  courseModule: ICourseModule;
}

export const CourseDayTab = observer(({ courseModule }: IProps) => {
  const { courseStore } = useStores();
  const { onSelectCourseModule, selectedCourseModuleId } = useCourse();
  const { isCourseModuleCompleted } = courseStore;
  const selectedClass = `border-blue-primary bg-color-light`;
  const notSelectedClass = `border-transparent bg-transparent`;
  const infoClass = `w-full text-sm font-medium flex items-center space-x-2 capitalize cursor-pointer py-4 px-2 border-l-[3px] ${selectedClass}`;

  const { isAllCompleted, isPartiallyCompleted } = isCourseModuleCompleted(courseModule._id);

  return (
    <div
      className={`${infoClass} ${courseModule._id === selectedCourseModuleId ? selectedClass : notSelectedClass}`}
      onClick={() => onSelectCourseModule(courseModule._id)}
    >
      <div className="flex items-center space-x-2.5 w-full">
        <div className="rounded-full border border-color-border">
          {isAllCompleted ? (
            <Check weight="bold" className="w-5 h-5 p-1 bg-green-primary text-white rounded-full" />
          ) : (
            <Circle
              weight="fill"
              className={`w-5 h-5 ${isPartiallyCompleted ? 'text-yellow-primary' : 'text-color-light'}`}
            />
          )}
        </div>
        <div className="flex-1 truncate flex flex-col space-y-0.5">
          <div className="truncate">{courseModule.name}</div>
          <div className="text-xs text-color-secondary">(Module {courseModule.day})</div>
        </div>
      </div>
    </div>
  );
});
