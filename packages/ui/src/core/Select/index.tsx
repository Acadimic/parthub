import { type ISelectItem } from '../../types';
import { PopoverContent, Popover as ShadcnPopover, PopoverTrigger } from '../../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/command';
import { CaretDownIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';
import * as React from 'react';
import { TextInput } from '../TextInput';

interface ISelectProps {
  options: ISelectItem[];
  values: string[];
  onChange: (value: ISelectItem[]) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  groupBy?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  className?: string;
  withInPortal?: boolean;
  title?: string;
  isCloseOnSelect?: boolean;
  notFoundComponent?: React.ReactNode;
  noSort?: boolean;
}

const SelectElement = ({
  options,
  values,
  onChange,
  label,
  required,
  placeholder,
  multiple = true,
  groupBy,
  disabled,
  leftSection,
  rightSection,
  className,
  title,
  isCloseOnSelect,
  notFoundComponent,
  noSort,
}: ISelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState<ISelectItem[]>([]);

  const addStateData = () => {
    const referenceValues = options.filter((item) => values.includes(item.value));
    setSelectedValues(referenceValues);
  };

  const handleSelect = (item: ISelectItem) => {
    if (!multiple) {
      const currentValues = [item];
      onChange(currentValues);
      setSelectedValues(currentValues);
      setOpen(false);
    } else {
      const isSelected = selectedValues.some((v) => v.value === item.value);
      let newValues: ISelectItem[];
      if (isSelected) {
        newValues = selectedValues.filter((v) => v.value !== item.value);
      } else {
        newValues = [...selectedValues, item];
      }
      setSelectedValues(newValues);
      onChange(newValues);
      if (isCloseOnSelect) setOpen(false);
    }
  };

  React.useEffect(() => {
    addStateData();
  }, [values]);

  const memoizedItems = React.useMemo(() => {
    const referenceValues = options.filter((item) => values.includes(item.value));
    return groupBy || noSort
      ? options
      : [...options].sort((a, b) => {
          let ai = referenceValues.indexOf(a);
          ai = ai === -1 ? referenceValues.length + options.indexOf(a) : ai;
          let bi = referenceValues.indexOf(b);
          bi = bi === -1 ? referenceValues.length + options.indexOf(b) : bi;
          return ai - bi;
        });
  }, [options, groupBy, noSort, values]);

  const groupedItems = React.useMemo(() => {
    if (!groupBy) return { '': memoizedItems };
    const groups: Record<string, ISelectItem[]> = {};
    memoizedItems.forEach((item) => {
      const group = item.group || 'Others';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [memoizedItems, groupBy]);

  const displayValue = selectedValues.map((item) => item.label).join(', ');

  return (
    <ShadcnPopover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className="relative w-full">
          <TextInput
            label={label}
            placeholder={placeholder || (label ? `Select ${label}` : 'Select')}
            rightSection={rightSection || <CaretDownIcon weight="bold" className="w-4 h-5" />}
            readOnly
            required={required}
            value={displayValue}
            inputClassName={cn('capitalize truncate cursor-pointer', className)}
            leftSection={leftSection}
            disabled={disabled}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-background-primary border border-color-border rounded-none"
        align="start"
      >
        {title && (
          <div className="border-b border-color-border px-3 py-2 text-sm font-medium bg-background-primary">
            <span>{title}</span>
          </div>
        )}
        <Command className="bg-background-primary" shouldFilter>
          <CommandInput placeholder={label ? `Search ${label}` : 'Search'} className="text-sm font-medium" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              <div className="h-full flex flex-col items-center justify-center gap-2 text-color-secondary text-sm">
                No options found
                {notFoundComponent}
              </div>
            </CommandEmpty>
            {Object.entries(groupedItems).map(([group, items]) => (
              <CommandGroup key={group} heading={groupBy ? group : undefined} className="p-0">
                {items.map((item) => {
                  const isSelected = selectedValues.some((v) => v.value === item.value);
                  return (
                    <CommandItem
                      key={item.value}
                      value={typeof item.label === 'string' ? item.label : item.value}
                      onSelect={() => handleSelect(item)}
                      className="font-medium text-sm py-2 px-3 cursor-pointer border-b border-color-border hover:!text-blue-primary rounded-none"
                    >
                      <CheckIcon className={cn('w-4 h-4 mr-1.5', isSelected ? 'opacity-100' : 'opacity-0')} />
                      <div className="flex-1 truncate">
                        <div className="truncate capitalize">{item.label}</div>
                        {item.description && (
                          <div className="truncate text-xs text-color-secondary">{item.description}</div>
                        )}
                      </div>
                      <XIcon className={cn('w-4 h-4 opacity-60', isSelected ? 'opacity-60' : 'opacity-0')} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </ShadcnPopover>
  );
};

export const Select = (props: ISelectProps) => {
  const { disabled, values } = props;
  const memoizedSelectElement = React.useMemo(() => <SelectElement {...props} />, [disabled, values]);
  return memoizedSelectElement;
};

export type { ISelectProps };
