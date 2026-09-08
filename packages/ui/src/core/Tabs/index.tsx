import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { cn } from '../../lib/cn';
import * as React from 'react';

export interface ITabItem {
  label: string;
  component: React.ReactNode;
  icon?: React.ReactElement<unknown>;
  iconPosition?: 'start' | 'end' | 'top' | 'bottom';
}

interface ITabsProps {
  tabs: ITabItem[];
  value?: number;
  onChange?: (index: number) => void;
}

export const Tabs = ({ tabs, value, onChange }: ITabsProps) => {
  const [selectedTabIndex, setSelectedTabIndex] = React.useState(value || 0);

  const handleChange = (val: string) => {
    const index = parseInt(val, 10);
    setSelectedTabIndex(index);
    if (onChange) onChange(index);
  };

  React.useEffect(() => {
    if (value !== undefined) setSelectedTabIndex(value);
  }, [value]);

  return (
    <ShadcnTabs value={String(selectedTabIndex)} onValueChange={handleChange}>
      <TabsList className="bg-transparent border-b border-color-border rounded-none w-full justify-start h-auto p-0">
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={index}
            value={String(index)}
            className={cn(
              'text-sm font-semibold rounded-none border-b-2 border-transparent px-4 py-2',
              'data-[state=active]:border-blue-primary data-[state=active]:text-blue-primary data-[state=active]:shadow-none',
            )}
          >
            <div className={cn('flex items-center gap-1.5', tab.iconPosition === 'end' && 'flex-row-reverse')}>
              {tab.icon}
              <span>{tab.label}</span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, index) => (
        <TabsContent key={index} value={String(index)}>
          {tab.component}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
};

export type { ITabsProps };
