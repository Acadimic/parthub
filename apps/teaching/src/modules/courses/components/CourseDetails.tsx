import { useStandardLookups, useSelectedCourse } from '@stores';

export const CourseDetails = () => {
  const selectedCourse = useSelectedCourse();
  const { getStandardNamesText } = useStandardLookups();

  if (!selectedCourse) return <></>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-center items-center gap-1">
        <div>
          <h1 className="font-semibold text-lg md:text-lg text-center">{selectedCourse.name}</h1>
        </div>
        <div className="text-sm font-medium">{getStandardNamesText(selectedCourse.standards ?? [])}</div>
      </div>
    </div>
  );
};
