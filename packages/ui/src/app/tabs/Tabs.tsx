import { type IconPosition } from '@repo/shared/enums';
import * as React from 'react';

interface ITab {
  label: string;
  component: React.ReactNode;
  icon?: React.ReactElement<unknown>;
  iconPosition?: IconPosition;
}

interface ITabProps {
  tabs: ITab[];
}

export const Tabs = ({ tabs }: ITabProps) => {
  const [selectedTabIndex, setSelectedTabIndex] = React.useState(0);

  return (
    <div>
      <div className="flex border-b border-color-border overflow-x-auto" role="tablist" aria-label="scrollable-tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            role="tab"
            id={`full-width-tab-${index}`}
            aria-controls={`full-width-tabpanel-${index}`}
            aria-selected={selectedTabIndex === index}
            onClick={() => setSelectedTabIndex(index)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              selectedTabIndex === index
                ? 'border-blue-primary text-blue-primary'
                : 'border-transparent text-color-secondary hover:text-color-primary'
            } ${tab.iconPosition === 'end' ? 'flex-row-reverse' : ''}`}
          >
            {tab.icon && <span className="flex items-center">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tabpanel"
            hidden={selectedTabIndex !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
          >
            {selectedTabIndex === index && <div>{tab.component}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
