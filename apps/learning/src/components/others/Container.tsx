import { type ReactNode } from 'react';

export const Container = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background px-4 md:px-8 relative">
      <div className="md:px-16 overflow-hidden">{children}</div>
    </div>
  );
};
