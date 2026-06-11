import React from 'react';

export const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background-primary">
      <header className="border-b border-color-border bg-background-paper px-6 py-4">
        <div className="text-lg font-bold text-color-primary">ParthHub</div>
      </header>
      <main>{children}</main>
    </div>
  );
};
