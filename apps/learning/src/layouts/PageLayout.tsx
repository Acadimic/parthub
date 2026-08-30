import { LearnerNavigation, PageHeader } from '@components/app';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  children: React.ReactNode;
  withNavigation?: boolean;
}

export const PageLayout = observer(({ children, withNavigation }: IProps) => {
  const { selectorStore } = useStores();
  const { selectedUser } = selectorStore;

  return (
    <>
      <div className={`bg-background-primary relative overflow-auto h-[100vh]`}>
        <div className="fixed top-0 z-50 w-full">
          <div>
            <PageHeader />
          </div>
        </div>
        <div className="relative">
          <div className="mt-14 sm:mt-16">
            {selectedUser && withNavigation && (
              <div className="bg-background-primary border-y border-color-border header-shadow fixed bottom-0 px-4 md:px-16 md:relative w-full z-[49]">
                <div className="md:max-w-sm pt-0.5 w-full">
                  <LearnerNavigation />
                </div>
              </div>
            )}
            <div>{children}</div>
          </div>
        </div>
      </div>
    </>
  );
});
