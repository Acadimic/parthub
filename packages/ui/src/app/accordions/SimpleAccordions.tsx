import { CaretRightIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { type IAccordionItem } from './Accordions';

interface IProps {
  items: IAccordionItem[];
  openIndexes?: number[];
  isIconLast?: boolean;
}

export const SimpleAccordions = ({ items, openIndexes, isIconLast }: IProps) => {
  const [opens, setOpens] = React.useState<boolean[]>(items.map((_, index) => openIndexes?.includes(index) || false));

  const handleChange = (index: number) => {
    const newOpens = [...opens];
    newOpens[index] = !newOpens[index];
    setOpens(newOpens);
  };

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div key={index} className="relative w-full">
          <button
            className={`w-full bg-background-primary flex items-center py-2 ${isIconLast ? 'flex-row' : 'flex-row-reverse'}`}
            onClick={() => handleChange(index)}
            aria-controls={`${index}-content`}
            aria-expanded={opens[index]}
          >
            <div className={`font-medium capitalize w-full text-left ${isIconLast ? 'mr-2' : 'ml-2'}`}>
              {item.title}
            </div>
            <CaretRightIcon
              weight="bold"
              className={`w-4 h-4 text-color-primary transition-transform duration-200 flex-shrink-0 ${opens[index] ? 'rotate-90' : ''}`}
            />
          </button>
          {opens[index] && <div className="w-full bg-background-primary">{item.component}</div>}
        </div>
      ))}
    </div>
  );
};
