import { PropsWithChildren } from 'react';

export const AuthContainer = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 py-8">
      <div className="flex flex-col gap-3 w-full">{children}</div>
    </div>
  );
};
