import { PropsWithChildren } from 'react';

export const DotIndicator = ({ children }: PropsWithChildren) => {
  return (
    <span className="relative inline-flex">
      {children}
      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-primary ring-2 ring-background-primary" />
    </span>
  );
};
