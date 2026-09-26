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
  openIndexes?: number[];
  isIconLast?: boolean;
  className?: string;
  /** Replaces the panel's default padding, for content that brings its own. */
  contentClassName?: string;
  type?: 'single' | 'multiple';
}

export const Accordion = ({
  items,
  openIndexes,
  isIconLast,
  className,
  contentClassName,
  type = 'multiple',
}: IAccordionProps) => {
  const defaultValues = openIndexes?.map(String) ?? [];

  if (type === 'single') {
    return (
      <ShadcnAccordion type="single" collapsible defaultValue={defaultValues[0]} className={cn('w-full', className)}>
        {items.map((item, index) => (
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
        ))}
      </ShadcnAccordion>
    );
  }

  return (
    <ShadcnAccordion type="multiple" defaultValue={defaultValues} className={cn('w-full', className)}>
      {items.map((item, index) => (
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
      ))}
    </ShadcnAccordion>
  );
};

export type { IAccordionProps };
