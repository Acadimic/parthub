import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {}

export const CourseDetails = observer(({}: IProps) => {
  const { selectorStore, standardStore } = useStores();
  const { selectedCourse } = selectorStore;
  const { getStandardsByIds } = standardStore;

  if (!selectedCourse) return <></>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-center items-center gap-1">
        <div>
          <h1 className="font-semibold text-lg md:text-lg text-center">{selectedCourse.name}</h1>
        </div>
        <div className="text-sm font-medium">
          {getStandardsByIds(selectedCourse.standards)
            .map((standard) => standard.name)
            .join(', ')}
        </div>
      </div>
    </div>
  );
});
