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
  /**
   * Classes for the root. Pass `flex h-full min-h-0 flex-col` to pin the tab strip and let the
   * panel scroll under it — without a hook here the strip is part of the caller's scroll and
   * disappears the moment the content is longer than the box.
   */
  className?: string;
  /** Classes for each panel, typically `min-h-0 flex-1 overflow-auto` alongside a flex root. */
  contentClassName?: string;
  /** Classes for each tab, for a denser strip (`px-3 py-1.5 text-xs`) in a narrow column. */
  triggerClassName?: string;
}

export const Tabs = ({ tabs, value, onChange, className, contentClassName, triggerClassName }: ITabsProps) => {
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
    <ShadcnTabs value={String(selectedTabIndex)} onValueChange={handleChange} className={className}>
      <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 shrink-0">
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={index}
            value={String(index)}
            className={cn(
              'text-sm font-semibold rounded-none border-b-2 border-transparent px-4 py-2',
              'data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none',
              triggerClassName,
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
        <TabsContent key={index} value={String(index)} className={contentClassName}>
          {tab.component}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
};

export type { ITabsProps };
