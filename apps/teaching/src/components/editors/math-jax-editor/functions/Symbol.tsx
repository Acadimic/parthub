import { Tooltip } from '@parthhub/ui/app';
import { DotsNineIcon } from '@phosphor-icons/react';
import { RenderEquation } from '@components/others';
import {
  ANGLE_BRACKETS,
  ARROWS,
  BRACKETS,
  BRACKETS_SIZE,
  GREEK,
  OPERATORS,
  RELATIONS,
  SPECIAL,
  TRIGONOMETRIC,
} from '../math.enum';
import { EquationType, SymbolEquationNode } from '../types';

interface IGroupedItem {
  group: string;
  items: {
    name: string;
    content: string;
    tooltip: string;
  }[];
}

const groupedItems: IGroupedItem[] = [
  {
    group: 'Greek Symbols',
    items: Object.entries(GREEK).map(([key, value]) => ({
      name: key,
      content: value,
      tooltip: key,
    })),
  },
  {
    group: 'Operators',
    items: Object.entries(OPERATORS).map(([key, value]) => ({
      name: key,
      content: value,
      tooltip: key,
    })),
  },
  {
    group: 'Relations',
    items: Object.entries(RELATIONS).map(([key, value]) => ({
      name: key,
      content: value,
      tooltip: key,
    })),
  },
  {
    group: 'Arrows',
    items: Object.entries(ARROWS).map(([key, value]) => ({
      name: key,
      content: value,
      tooltip: key,
    })),
  },
  {
    group: 'Special Symbols',
    items: Object.entries(SPECIAL).map(([key, value]) => ({
      name: key,
      content: value,
      tooltip: key,
    })),
  },
  {
    group: 'Brackets',
    items: [
      ...Object.entries(BRACKETS_SIZE)
        .map(([bracketSizeName, bracketSizeValue]) =>
          [...Object.entries(BRACKETS), ...Object.entries(ANGLE_BRACKETS)].map(([name, value]) => ({
            name,
            content: `${bracketSizeValue} ${value}`,
            tooltip: `${bracketSizeName} ${name}`,
          })),
        )
        .flat(),
    ],
  },
  {
    group: 'Trigonometric Functions',
    items: Object.entries(TRIGONOMETRIC).map(([key, value]) => ({
      name: key,
      content: value,
      tooltip: key,
    })),
  },
];

interface IProps {
  block: SymbolEquationNode;
  handleChange: (block: SymbolEquationNode) => void;
  closeModal: () => void;
}

export const Symbol = ({ block, handleChange, closeModal }: IProps) => {
  const handleSubmit = (name: string, content: string) => {
    handleChange({ type: EquationType.SYMBOL, name, content });
    closeModal();
  };

  return (
    <div className="flex flex-col gap-6">
      {groupedItems.map((group) => (
        <div key={group.group} className="flex flex-col">
          <div className="font-medium text-base mb-4 pb-2 border-b border-color-border flex items-center gap-2">
            <DotsNineIcon weight="bold" className="w-4 h-4 text-blue-primary" />{' '}
            <span className="font-semibold text-sm">{group.group}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {group.items.map((item) => {
              return (
                <div
                  className="flex items-center cursor-pointer hover:bg-background-paper rounded"
                  key={item.tooltip}
                  onClick={() => handleSubmit(item.name, item.content)}
                >
                  <Tooltip title={item.tooltip}>
                    <div className="px-2 py-1">
                      <RenderEquation equation={item.content} />
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
