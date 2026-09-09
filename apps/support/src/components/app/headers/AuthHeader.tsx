import { ToggleTheme } from '@repo/ui/app';

export const AuthHeader = () => {
  return (
    <>
      <div className={`bg-background-primary w-full`}>
        <div className="px-4 md:px-8 py-1.5 border-b border-color-border">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-end space-x-2">
              <div className="text-lg font-bold">Acadimic</div>
              <div className="blue-gradient font-semibold text-xs">Support</div>
            </div>
            <div className="flex items-center space-x-4">
              <ToggleTheme />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
