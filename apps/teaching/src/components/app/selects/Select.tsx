import { BlankState } from '@components/others';
import { type ISelectItem } from '@interfaces';
import { CaretDownIcon, CheckIcon, MagnifyingGlassIcon, SquaresFourIcon, XIcon } from '@phosphor-icons/react';
import { ALL } from '@utils/constants';
import * as React from 'react';
import { TextInput } from '@repo/ui/app';

const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

interface IProps {
  withInPortal?: boolean;
  title?: string;
  items: ISelectItem[];
  required?: boolean;
  placeholder?: string;
  label?: string;
  values: string[];
  onChange: (value: ISelectItem[]) => void;
  isSingleSelect?: boolean;
  isGrouped?: boolean;
  leftsection?: React.ReactNode;
  rightsection?: React.ReactNode;
  isDisabled?: boolean;
  isCloseOnSelect?: boolean;
  notFoundComponent?: React.ReactNode;
  noSort?: boolean;
  className?: string;
}

const SelectElement = ({
  withInPortal,
  placeholder,
  label,
  title,
  items,
  required,
  values,
  onChange,
  isSingleSelect,
  isGrouped,
  leftsection,
  rightsection,
  isDisabled,
  isCloseOnSelect,
  notFoundComponent,
  noSort,
  className,
}: IProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState<ISelectItem[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const addStateData = () => {
    const referenceValues = items.filter((item) => values.includes(item.value));
    setSelectedValues(referenceValues);
  };

  const handleClick = () => {
    if (isOpen || isDisabled) return;
    addStateData();
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleClose = () => {
    onChange(selectedValues);
    setIsOpen(false);
  };

  const onClose = () => {
    setIsOpen(false);
  };

  const handleSelect = (option: ISelectItem) => {
    if (isSingleSelect) {
      const currentValues = [option];
      onChange(currentValues);
      setSelectedValues(currentValues);
      onClose();
    } else if (option.value === ALL) {
      onChange([]);
      setSelectedValues([option]);
      onClose();
    } else {
      const isSelected = selectedValues.some((v) => v.value === option.value);
      let newValues: ISelectItem[];
      if (isSelected) {
        newValues = selectedValues.filter((v) => v.value !== option.value);
      } else {
        newValues = [...selectedValues, option];
      }
      setSelectedValues(newValues);
      onChange(newValues);
      if (isCloseOnSelect) onClose();
    }
  };

  React.useEffect(() => {
    addStateData();
  }, [values]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedValues]);

  const memoizedItems = React.useMemo(() => {
    const referenceValues = items.filter((item) => values.includes(item.value));
    let sortedItems =
      isGrouped || noSort
        ? items
        : [...items].sort((a, b) => {
            let ai = referenceValues.indexOf(a);
            ai = ai === -1 ? referenceValues.length + items.indexOf(a) : ai;
            let bi = referenceValues.indexOf(b);
            bi = bi === -1 ? referenceValues.length + items.indexOf(b) : bi;
            return ai - bi;
          });
    if (searchTerm) {
      sortedItems = sortedItems.filter(
        (item) =>
          // Labels may be JSX; keep those visible rather than filtering out what cannot be matched.
          typeof item.label !== 'string' ||
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          Boolean(item.description?.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }
    return sortedItems;
  }, [items, isGrouped, noSort, values, searchTerm]);

  const groupedItems = React.useMemo(() => {
    if (!isGrouped) return null;
    const groups: Record<string, ISelectItem[]> = {};
    memoizedItems.forEach((item) => {
      const group = item.group || 'Others';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [memoizedItems, isGrouped]);

  const isSelected = (option: ISelectItem) => selectedValues.some((v) => v.value === option.value);

  const renderOption = (option: ISelectItem) => {
    const selected = isSelected(option);
    return (
      <button
        key={option.value}
        className="w-full bg-background-primary m-0 font-medium text-sm flex py-2 px-3 cursor-pointer items-center space-x-1 border-b border-x border-color-border hover:text-blue-primary text-left"
        onClick={() => handleSelect(option)}
      >
        <CheckIcon
          weight="bold"
          className="w-4 h-4 mr-1 flex-shrink-0"
          style={{ visibility: selected ? 'visible' : 'hidden' }}
        />
        <div className="flex-grow truncate">
          <div className="truncate capitalize w-full">{option.label}</div>
          {option.description && <div className="truncate text-xs text-color-secondary">{option.description}</div>}
        </div>
        <XIcon
          weight="bold"
          className="w-4 h-4 opacity-60 flex-shrink-0"
          style={{ visibility: selected ? 'visible' : 'hidden' }}
        />
      </button>
    );
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div onClick={handleClick}>
        <TextInput
          label={label}
          placeholder={placeholder || (label ? `Select ${label}` : 'Select')}
          rightsection={rightsection || <CaretDownIcon weight="bold" className="w-4 h-5" />}
          readOnly
          required={required}
          value={capitalize(selectedValues.map((item) => item.label).join(', '))}
          className={`capitalize truncate ${className}`}
          leftsection={leftsection}
          disabled={isDisabled}
        />
      </div>
      {isOpen && (
        <div className={`absolute top-full left-0 z-[1400] ${withInPortal ? 'w-[200px]' : 'w-full'} shadow-lg`}>
          {title && (
            <div className="border-b border-color-border px-3 py-2 text-sm font-medium bg-background-primary">
              <span>{title}</span>
            </div>
          )}
          <div className="border border-color-border border-t rounded-t-sm bg-background-primary">
            <div className="flex items-center px-3 py-1.5 border-b border-color-border">
              <MagnifyingGlassIcon className="w-5 h-5 text-blue-primary mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder={label ? `Search ${label}` : 'Search'}
                className="w-full text-sm font-medium bg-transparent outline-none min-w-[160px] py-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {memoizedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 py-4 bg-background-primary border-x border-b border-color-border">
                <BlankState label="Not Found" iconSize="h-8" />
                {notFoundComponent}
              </div>
            ) : isGrouped && groupedItems ? (
              Object.entries(groupedItems).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="flex items-center text-xs font-medium text-color-secondary px-3 py-2 border-b border-x border-color-border bg-background-primary capitalize space-x-2">
                    <SquaresFourIcon className="text-blue-primary h-4 w-4" />
                    <div>{group}</div>
                  </div>
                  {groupItems.map(renderOption)}
                </div>
              ))
            ) : (
              memoizedItems.map(renderOption)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Select = (props: IProps) => {
  const { isDisabled, values } = props;
  const memoizedSelectElement = React.useMemo(() => <SelectElement {...props} />, [isDisabled, values]);
  return memoizedSelectElement;
};
