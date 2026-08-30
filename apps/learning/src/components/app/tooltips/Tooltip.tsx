import * as React from 'react';

interface IProps {
  children: React.ReactNode | string;
  title?: React.ReactNode | string;
}

export const Tooltip = ({ children, title }: IProps) => {
  return (
    <span className="group relative inline-block">
      <span>{children}</span>
      {(title || children) && (
        <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-color-primary text-color-opposite whitespace-nowrap z-50">
          {title || children}
        </span>
      )}
    </span>
  );
};
