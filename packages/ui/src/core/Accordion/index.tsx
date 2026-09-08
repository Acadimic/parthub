import { Accordion as ShadcnAccordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { cn } from '../../lib/cn';
import * as React from 'react';

export interface IAccordionItem {
  title: string;
  component: React.ReactNode;
  icon?: React.ReactNode;
}

interface IAccordionProps {
  items: IAccordionItem[];
  openIndexes?: number[];
  isIconLast?: boolean;
  className?: string;
  type?: 'single' | 'multiple';
}

export const Accordion = ({ items, openIndexes, isIconLast, className, type = 'multiple' }: IAccordionProps) => {
  const defaultValues = openIndexes?.map(String) || [];

  if (type === 'single') {
    return (
      <ShadcnAccordion type="single" collapsible defaultValue={defaultValues[0]} className={cn('w-full', className)}>
        {items.map((item, index) => (
          <AccordionItem key={index} value={String(index)} className="border-color-border">
            <AccordionTrigger
              className={cn('text-sm font-semibold py-3 px-3 hover:no-underline', isIconLast && 'flex-row-reverse')}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">{item.component}</AccordionContent>
          </AccordionItem>
        ))}
      </ShadcnAccordion>
    );
  }

  return (
    <ShadcnAccordion type="multiple" defaultValue={defaultValues} className={cn('w-full', className)}>
      {items.map((item, index) => (
        <AccordionItem key={index} value={String(index)} className="border-color-border">
          <AccordionTrigger
            className={cn('text-sm font-semibold py-3 px-3 hover:no-underline', isIconLast && 'flex-row-reverse')}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.title}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">{item.component}</AccordionContent>
        </AccordionItem>
      ))}
    </ShadcnAccordion>
  );
};

export type { IAccordionProps };
