import React from 'react';

export const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="border-b border-color-border bg-background-paper px-6 py-4">
        <div className="text-lg font-bold text-color-primary">ParthHub</div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
};
