import { useCourse } from '@hooks/course.hook';
import { CheckIcon, CircleIcon } from '@phosphor-icons/react';
import { type ICourseModule, useCourseLookups } from '@stores';

interface IProps {
  courseModule: ICourseModule;
}

export const CourseDayTab = ({ courseModule }: IProps) => {
  const courseStore = useCourseLookups();
  const { onSelectCourseModule, selectedCourseModuleId } = useCourse();
  const { isCourseModuleCompleted } = courseStore;
  const selectedClass = `border-primary bg-accent`;
  const notSelectedClass = `border-transparent bg-transparent`;
  const infoClass = `w-full text-sm font-medium flex items-center space-x-2 capitalize cursor-pointer py-4 px-2 border-l-[3px] ${selectedClass}`;

  const { isAllCompleted, isPartiallyCompleted } = isCourseModuleCompleted(courseModule._id);

  return (
    <div
      className={`${infoClass} ${courseModule._id === selectedCourseModuleId ? selectedClass : notSelectedClass}`}
      onClick={() => onSelectCourseModule(courseModule._id)}
    >
      <div className="flex items-center space-x-2.5 w-full">
        <div className="rounded-full border border-border">
          {isAllCompleted ? (
            <CheckIcon weight="bold" className="w-5 h-5 p-1 bg-success text-success-foreground rounded-full" />
          ) : (
            <CircleIcon
              weight="fill"
              className={`w-5 h-5 ${isPartiallyCompleted ? 'text-warning' : 'text-muted-foreground'}`}
            />
          )}
        </div>
        <div className="flex-1 truncate flex flex-col space-y-0.5">
          <div className="truncate">{courseModule.name}</div>
          <div className="text-xs text-muted-foreground">(Module {courseModule.day})</div>
        </div>
      </div>
    </div>
  );
};
