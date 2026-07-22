import { CaretRight } from '@phosphor-icons/react';
import * as React from 'react';

export interface IAccordionItem {
  id?: string;
  title: string | React.ReactNode;
  component: string | React.ReactNode;
}

interface IProps {
  items: IAccordionItem[];
  openIndexes?: number[];
  isIconLast?: boolean;
}

export const Accordions = ({ items, openIndexes, isIconLast }: IProps) => {
  const [opens, setOpens] = React.useState<boolean[]>(items.map((_, index) => openIndexes?.includes(index) || false));

  const handleChange = (index: number) => {
    const newOpens = [...opens];
    newOpens[index] = !newOpens[index];
    setOpens(newOpens);
  };

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} id={item.id} className="relative">
          <button
            className={`w-full bg-background-primary flex items-center py-2 px-4 ${isIconLast ? 'flex-row' : 'flex-row-reverse'}`}
            onClick={() => handleChange(index)}
            aria-controls={`${index}-content`}
            aria-expanded={opens[index]}
          >
            <div className={`font-medium capitalize w-full text-left ${isIconLast ? 'mr-2' : 'ml-2'}`}>
              {item.title}
            </div>
            <CaretRight
              weight="bold"
              className={`w-4 h-4 text-color-primary transition-transform duration-200 flex-shrink-0 ${opens[index] ? 'rotate-90' : ''}`}
            />
          </button>
          {opens[index] && (
            <div id={`${index}-content`} className="bg-background-primary w-full">
              {item.component}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
