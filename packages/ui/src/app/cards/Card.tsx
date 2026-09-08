import { type ReactNode } from 'react';

interface IProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: IProps) => {
  return (
    <div
      className={`bg-background-primary border-color-border relative h-full ${className ? className : 'px-4 py-4 border'}`}
    >
      {children}
    </div>
  );
};
