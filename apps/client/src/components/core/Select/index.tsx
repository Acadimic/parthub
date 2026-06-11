import { ISelectItem } from '@interfaces';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import SearchIcon from '@mui/icons-material/Search';
import { capitalize, InputAdornment, TextField } from '@mui/material';
import Autocomplete, { autocompleteClasses, AutocompleteCloseReason } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import { CaretDown } from '@phosphor-icons/react';
import * as React from 'react';
import { TextInput } from '../TextInput';

const StyledPopper = styled(Popper)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 1,
  borderRadius: 0,
  width: 'fit-content',
}));

const StyledAutocompletePopper = styled('div')(() => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    color: 'inherit',
    borderRadius: 0,
    margin: 0,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
    [`& .${autocompleteClasses.option}`]: {
      minHeight: 'auto',
      alignItems: 'flex-start',
      padding: 8,
    },
    '::-webkit-scrollbar': { display: 'none' },
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: 'relative',
  },
}));

interface IPopperComponentProps {
  anchorEl?: unknown;
  disablePortal?: boolean;
  open: boolean;
}

function PopperComponent(props: IPopperComponentProps) {
  const { disablePortal, anchorEl, open, ...other } = props;
  return <StyledAutocompletePopper {...other} className="!bg-background-primary" />;
}

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
  withInPortal,
  title,
  isCloseOnSelect,
  notFoundComponent,
  noSort,
}: ISelectProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedValues, setSelectedValues] = React.useState<ISelectItem[]>([]);

  const addStateData = () => {
    const referenceValues = options.filter((item) => values.includes(item.value));
    setSelectedValues(referenceValues);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (anchorEl) return;
    addStateData();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    onChange(selectedValues);
    onClose();
  };

  const onClose = () => {
    if (anchorEl) anchorEl.focus();
    setAnchorEl(null);
  };

  const handleChange = (newValues: ISelectItem[]) => {
    if (!multiple) {
      if (newValues.length) {
        const currentValues = [newValues[newValues.length - 1]];
        onChange(currentValues);
        setSelectedValues(currentValues);
      }
      onClose();
    } else {
      setSelectedValues(newValues);
      onChange(newValues);
      if (isCloseOnSelect) onClose();
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

  const open = Boolean(anchorEl);
  const id = open ? 'select-label' : undefined;

  return (
    <div className="relative w-full">
      <div aria-describedby={id} onClick={handleClick}>
        <TextInput
          label={label}
          placeholder={placeholder || (label ? `Select ${label}` : 'Select')}
          rightSection={rightSection || <CaretDown weight="bold" className="w-4 h-5" />}
          readOnly
          required={required}
          value={capitalize(selectedValues.map((item) => item.label).join(', '))}
          inputClassName={`capitalize truncate ${className || ''}`}
          leftSection={leftSection}
          disabled={disabled}
        />
      </div>
      <StyledPopper
        className={`${withInPortal ? 'w-[200px]' : 'w-full'} box-shadow`}
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        disablePortal={!withInPortal}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <div>
            {title ? (
              <Box className="border-b border-color-border px-3 py-2 text-sm font-medium bg-background-primary">
                <span>{title}</span>
              </Box>
            ) : null}
            <Autocomplete
              disabled={disabled}
              open
              multiple
              value={selectedValues}
              onClose={(_event: React.ChangeEvent<unknown>, reason: AutocompleteCloseReason) => {
                if (reason === 'escape') handleClose();
              }}
              onChange={(event, newValues, reason) => {
                if (
                  event.type === 'keydown' &&
                  (event as React.KeyboardEvent).key === 'Backspace' &&
                  reason === 'removeOption'
                ) {
                  return;
                }
                handleChange(newValues);
              }}
              disableCloseOnSelect={!isCloseOnSelect}
              PopperComponent={PopperComponent}
              renderTags={() => null}
              noOptionsText={
                <div className="h-full flex flex-col items-center justify-center gap-2 text-color-secondary text-sm">
                  No options found
                  {notFoundComponent}
                </div>
              }
              renderOption={(props, option, { selected }) => (
                <li
                  {...props}
                  key={option.value}
                  className="bg-background-primary m-0 font-medium text-sm flex py-2 px-3 cursor-pointer items-center space-x-1 border-b border-x border-color-border hover:!text-blue-primary"
                >
                  <Box
                    component={DoneIcon}
                    sx={{ width: 17, height: 17, mr: '5px', ml: '-2px' }}
                    style={{ visibility: selected ? 'visible' : 'hidden' }}
                  />
                  <Box sx={{ flexGrow: 1 }} className="w-full truncate">
                    <div className="truncate capitalize w-full">{option.label}</div>
                    {option.description && (
                      <div className="truncate text-xs text-color-secondary">{option.description}</div>
                    )}
                  </Box>
                  <Box
                    component={CloseIcon}
                    sx={{ opacity: 0.6, width: 18, height: 18 }}
                    style={{ visibility: selected ? 'visible' : 'hidden' }}
                  />
                </li>
              )}
              options={memoizedItems}
              renderInput={(params) => (
                <TextField
                  ref={params.InputProps.ref}
                  inputProps={{ ...params.inputProps, className: 'py-0' }}
                  placeholder={label ? `Search ${label}` : 'Search'}
                  InputProps={{
                    className:
                      'font-medium text-sm border border-color-border rounded-none focus:border-blue-primary !bg-background-primary',
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon className="w-5 h-5 text-blue-primary pt-0.5" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& fieldset': { border: 'none' },
                    '& .MuiInputBase-input': { minWidth: '160px' },
                  }}
                  fullWidth
                />
              )}
              groupBy={groupBy ? (option) => option.group || 'Others' : undefined}
              renderGroup={(params) => (
                <div key={params.group}>
                  <div className="flex items-center text-xs font-medium text-color-secondary px-3 py-2 border-b border-x border-color-border bg-background-primary capitalize space-x-2">
                    <div>{params.group}</div>
                  </div>
                  <div>{params.children}</div>
                </div>
              )}
            />
          </div>
        </ClickAwayListener>
      </StyledPopper>
    </div>
  );
};

export const Select = (props: ISelectProps) => {
  const { disabled, values } = props;
  const memoizedSelectElement = React.useMemo(() => <SelectElement {...props} />, [disabled, values]);
  return memoizedSelectElement;
};

export type { ISelectProps };
