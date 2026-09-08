import { CaretRightIcon } from '@phosphor-icons/react';
import NextLink from 'next/link';
import * as React from 'react';

export interface IBreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface IBreadcrumbProps {
  items: IBreadcrumbItem[];
  maxItems?: number;
}

export const Breadcrumb = ({ items }: IBreadcrumbProps) => {
  return (
    <nav aria-label="breadcrumbs">
      <ol className="flex items-center space-x-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center space-x-1.5">
              {index > 0 && <CaretRightIcon weight="bold" className="w-3 h-3 text-color-secondary" />}
              {isLast ? (
                <span className="text-xs font-bold text-color-primary">{item.label}</span>
              ) : (
                <NextLink
                  href={item.href}
                  onClick={item.onClick}
                  className="text-xs font-medium text-color-secondary hover:text-blue-primary flex items-center space-x-1"
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </NextLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export type { IBreadcrumbProps };
