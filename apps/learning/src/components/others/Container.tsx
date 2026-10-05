import { type ReactNode } from 'react';

export const Container = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background px-4 md:px-8 relative">
      {/* `clip`, not `hidden`: a hidden overflow becomes the scroll box every `sticky` child sticks to, so none stick. */}
      <div className="md:px-16 overflow-clip">{children}</div>
    </div>
  );
};
