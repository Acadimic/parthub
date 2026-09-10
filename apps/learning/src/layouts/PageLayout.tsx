import { PageHeader } from '@components/app/headers';
import { LearnerNavigation } from '@components/app/navigations';
import { useSelectedUser } from '@stores';

interface IProps {
  children: React.ReactNode;
  withNavigation?: boolean;
}

export const PageLayout = ({ children, withNavigation }: IProps) => {
  const selectedUser = useSelectedUser();

  return (
    <>
      <div className={`bg-background relative overflow-auto h-[100vh]`}>
        <div className="fixed top-0 z-50 w-full">
          <div>
            <PageHeader />
          </div>
        </div>
        <div className="relative">
          <div className="mt-14 sm:mt-16">
            {selectedUser && withNavigation && (
              <div className="bg-background border-y border-border header-shadow fixed bottom-0 px-4 md:px-16 md:relative w-full z-[49]">
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
};
