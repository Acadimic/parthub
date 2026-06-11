import React from 'react';

export const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-color-border bg-background-paper p-4">
        <div className="text-lg font-bold text-color-primary">ParthHub</div>
        <nav className="mt-6 flex flex-col gap-2">
          <a href="/home" className="rounded p-2 text-color-primary hover:bg-background-secondary">Home</a>
          <a href="/courses" className="rounded p-2 text-color-primary hover:bg-background-secondary">Courses</a>
          <a href="/profile" className="rounded p-2 text-color-primary hover:bg-background-secondary">Profile</a>
        </nav>
      </aside>
      <main className="flex-1 bg-background-secondary p-6">{children}</main>
    </div>
  );
};
