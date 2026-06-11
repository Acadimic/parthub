import { Tabs as MuiTabs } from '@mui/material';
import Tab from '@mui/material/Tab';
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

function a11yProps(index: number) {
  return {
    id: `core-tab-${index}`,
    'aria-controls': `core-tabpanel-${index}`,
  };
}

export const Tabs = ({ tabs, value, onChange }: ITabsProps) => {
  const [selectedTabIndex, setSelectedTabIndex] = React.useState(value || 0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTabIndex(newValue);
    if (onChange) onChange(newValue);
  };

  React.useEffect(() => {
    if (value !== undefined) setSelectedTabIndex(value);
  }, [value]);

  return (
    <div>
      <MuiTabs
        value={selectedTabIndex}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons={false}
        aria-label="scrollable-tabs"
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          },
          '& .Mui-selected': {
            color: 'var(--tw-color-blue-primary, #009ef7) !important',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: 'var(--tw-color-blue-primary, #009ef7)',
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            icon={tab.icon || undefined}
            label={tab.label}
            iconPosition={tab.iconPosition}
            {...a11yProps(index)}
          />
        ))}
      </MuiTabs>
      <div>
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tabpanel"
            hidden={selectedTabIndex !== index}
            id={`core-tabpanel-${index}`}
            aria-labelledby={`core-tab-${index}`}
          >
            {selectedTabIndex === index && <div>{tab.component}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export type { ITabsProps };
