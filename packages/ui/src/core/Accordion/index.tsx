import { Accordion as ShadcnAccordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { cn } from '../../lib/cn';
import * as React from 'react';

export interface IAccordionItem {
  /** Plain text, or a composed heading such as a numbered row with a subtitle. */
  title: React.ReactNode;
  component: React.ReactNode;
  icon?: React.ReactNode;
}

interface IAccordionProps {
  items: IAccordionItem[];
  /** The panels open at first; with `onOpenIndexesChange`, the panels open now. */
  openIndexes: number[];
  onOpenIndexesChange?: (openIndexes: number[]) => void;
  isIconLast?: boolean;
  className?: string;
  /** Replaces the panel's default padding, for content that brings its own. */
  contentClassName?: string;
  type?: 'single' | 'multiple';
}

const toIndexes = (values: string[]) => values.filter(Boolean).map(Number);

export const Accordion = ({
  items,
  openIndexes,
  onOpenIndexesChange,
  isIconLast,
  className,
  contentClassName,
  type = 'multiple',
}: IAccordionProps) => {
  const values = openIndexes.map(String);
  const children = items.map((item, index) => (
    <AccordionItem key={index} value={String(index)} className="border-border">
      <AccordionTrigger
        className={cn('text-sm font-semibold py-3 px-3 hover:no-underline', isIconLast && 'flex-row-reverse')}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {item.icon}
          <span className="min-w-0 flex-1">{item.title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className={contentClassName ?? 'px-3 pb-3'}>{item.component}</AccordionContent>
    </AccordionItem>
  ));

  if (type === 'single') {
    // Radix's single accordion says "nothing open" with an empty string.
    const state = onOpenIndexesChange
      ? { value: values[0] ?? '', onValueChange: (value: string) => onOpenIndexesChange(toIndexes([value])) }
      : { defaultValue: values[0] };
    return (
      <ShadcnAccordion type="single" collapsible {...state} className={cn('w-full', className)}>
        {children}
      </ShadcnAccordion>
    );
  }

  const state = onOpenIndexesChange
    ? { value: values, onValueChange: (next: string[]) => onOpenIndexesChange(toIndexes(next)) }
    : { defaultValue: values };
  return (
    <ShadcnAccordion type="multiple" {...state} className={cn('w-full', className)}>
      {children}
    </ShadcnAccordion>
  );
};

export type { IAccordionProps };
