import { Accordions } from '@repo/ui/app';
import { DynamicSubtitle } from '@components/common';
import { useStores } from '@stores';
import { getPlural } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { Sessions } from './Sessions';

export const SessionsInfo = observer(() => {
  const { selectorStore, meetStore } = useStores();
  const { getMeetsByIds } = meetStore;
  const { selectedCourse } = selectorStore;

  if (!selectedCourse || !selectedCourse.meets.length) return <></>;

  const meets = getMeetsByIds(selectedCourse?.meets);

  return (
    <div>
      <Accordions
        openIndexes={meets.map((_, index) => index)}
        items={[
          {
            title: (
              <DynamicSubtitle title={getPlural(meets.length, 'Session')} subtitle="Schedule" count={meets.length} />
            ),
            component: (
              <div className="py-2 px-10">
                <Sessions meets={meets} isSmallJoinable={true} isCopyIconOnly={true} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
});
