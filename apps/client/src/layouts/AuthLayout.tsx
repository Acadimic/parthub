import React from 'react';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary">
      <div className="w-full max-w-md p-6">{children}</div>
    </div>
  );
};
