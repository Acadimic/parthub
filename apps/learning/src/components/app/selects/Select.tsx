import { BlankState } from '@components/others';
import { type ISelectItem } from '@interfaces';
import { CaretDownIcon, CheckIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { ALL } from '@utils/constants';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Label } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';

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

/** How many chips a multi-select shows before collapsing the rest into a "+N" count. */
const VISIBLE_CHIP_COUNT = 3;
const VIEWPORT_GAP = 8;
const PANEL_OFFSET = 4;
const PANEL_MAX_HEIGHT = 320;
const PANEL_MIN_WIDTH = 240;
const OPEN_KEYS = ['Enter', ' ', 'ArrowDown', 'ArrowUp'];
const ARROW_STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
/**
 * Where the panel sits until it has been measured: fixed at the origin and transparent. An
 * unpositioned panel lands at the foot of the document, where the autofocused search input scrolls
 * the page to it — and the scroll listener then closes the panel before it is ever seen. Opacity
 * rather than `visibility: hidden`, because a hidden element refuses focus and the search input has
 * to take it on mount for typing and Escape to land in the list.
 */
const HIDDEN_PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  opacity: 0,
  pointerEvents: 'none',
};

const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

/** The text a label matches against; a JSX label has none and is kept visible whatever the search. */
const labelText = (item: ISelectItem) => (typeof item.label === 'string' ? item.label.toLowerCase() : null);

/** Selected items first, in their selected order, then the rest in list order. */
const sortSelectedFirst = (items: ISelectItem[], values: string[]) => {
  const rank = (item: ISelectItem) => {
    const index = values.indexOf(item.value);
    return index === -1 ? values.length + items.indexOf(item) : index;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
};

const matchesSearch = (item: ISelectItem, term: string) => {
  const text = labelText(item);
  return text === null || text.includes(term) || Boolean(item.description?.toLowerCase().includes(term));
};

/** Items bucketed by `group`, in first-seen order; those without one fall under "Others". */
const groupItems = (items: ISelectItem[]) => {
  const groups = new Map<string, ISelectItem[]>();
  items.forEach((item) => {
    const group = item.group || 'Others';
    groups.set(group, [...(groups.get(group) ?? []), item]);
  });
  return groups;
};

/**
 * Places the panel under the trigger in viewport coordinates, or above it when the space below is
 * short. Measured on open and again when the list changes length, since that changes its height and
 * so whether it fits. Returns the style to apply to the panel.
 */
const usePanelPlacement = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  options: { itemCount: number; minWidth: boolean },
) => {
  const [style, setStyle] = React.useState<React.CSSProperties>(HIDDEN_PANEL_STYLE);

  React.useLayoutEffect(() => {
    if (!isOpen) {
      setStyle(HIDDEN_PANEL_STYLE);
      return;
    }
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const rect = trigger.getBoundingClientRect();
    const width = options.minWidth ? Math.max(PANEL_MIN_WIDTH, rect.width) : rect.width;
    const left = Math.min(Math.max(VIEWPORT_GAP, rect.left), window.innerWidth - width - VIEWPORT_GAP);
    const height = Math.min(panel.getBoundingClientRect().height, PANEL_MAX_HEIGHT);
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP;
    const opensUp = spaceBelow < height && rect.top > spaceBelow;
    setStyle({
      position: 'fixed',
      left,
      width,
      top: opensUp ? Math.max(VIEWPORT_GAP, rect.top - height - PANEL_OFFSET) : rect.bottom + PANEL_OFFSET,
      maxHeight: opensUp ? rect.top - VIEWPORT_GAP - PANEL_OFFSET : spaceBelow,
    });
  }, [isOpen, options.itemCount, options.minWidth, triggerRef, panelRef]);

  return style;
};

/**
 * Closes the panel on a click outside trigger and panel, on a resize, and on any scroll that is not
 * the panel's own list. A fixed panel cannot follow a scrolling ancestor, so it closes rather than
 * drifting away from its trigger; captured, because the scroll happens inside a drawer and does not
 * bubble.
 */
const useCloseOnOutside = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  close: () => void,
) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    const onScroll = (event: Event) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen, triggerRef, panelRef, close]);
};

interface IOptionProps {
  item: ISelectItem;
  isSelected: boolean;
  isActive: boolean;
  onHover: () => void;
  onSelect: () => void;
}

const SelectOption = ({ item, isSelected, isActive, onHover, onSelect }: IOptionProps) => (
  <div
    role="option"
    aria-selected={isSelected}
    className={cn(
      'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors',
      isActive ? 'bg-accent' : 'hover:bg-accent/70',
      isSelected && 'font-semibold',
    )}
    onMouseEnter={onHover}
    // Keeps focus in the search input, so typing continues to filter after a pick.
    onMouseDown={(event) => event.preventDefault()}
    onClick={onSelect}
  >
    {item.icon ? <span className="shrink-0 text-muted-foreground">{item.icon}</span> : null}
    <div className="min-w-0 flex-1">
      <div className="truncate capitalize">{item.label}</div>
      {item.description ? <div className="truncate text-xs text-muted-foreground">{item.description}</div> : null}
    </div>
    <CheckIcon
      weight="bold"
      className={cn('h-4 w-4 shrink-0 text-primary', isSelected ? 'opacity-100' : 'opacity-0')}
    />
  </div>
);

interface IChipsProps {
  items: ISelectItem[];
  isSingleSelect?: boolean;
  isDisabled?: boolean;
  onRemove: (item: ISelectItem) => void;
}

/** The selection as shown in the trigger: plain text for one value, chips for many. */
const SelectedChips = ({ items, isSingleSelect, isDisabled, onRemove }: IChipsProps) => {
  if (isSingleSelect) return <span className="truncate capitalize">{items[0]?.label}</span>;
  const shown = items.slice(0, VISIBLE_CHIP_COUNT);
  const hidden = items.length - shown.length;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {shown.map((item) => (
        <span
          key={item.value}
          className="inline-flex max-w-[12rem] items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
        >
          <span className="truncate capitalize">{item.label}</span>
          {!isDisabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Remove ${typeof item.label === 'string' ? item.label : 'item'}`}
              className="-mr-0.5 rounded-sm p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(item);
              }}
            >
              <XIcon weight="bold" className="h-3 w-3" />
            </span>
          )}
        </span>
      ))}
      {hidden > 0 ? (
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">+{hidden}</span>
      ) : null}
    </span>
  );
};

interface IPanelProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
  listboxId: string;
  title?: string;
  label?: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  isSingleSelect?: boolean;
  visibleItems: ISelectItem[];
  groupedItems: Map<string, ISelectItem[]> | null;
  renderOption: (item: ISelectItem) => React.ReactNode;
  notFoundComponent?: React.ReactNode;
  selectedCount: number;
  onClear: () => void;
}

/** The open list: search row, options (grouped or flat), and a clear-all footer for multi-selects. */
const SelectPanel = ({
  panelRef,
  style,
  listboxId,
  title,
  label,
  searchTerm,
  onSearchChange,
  onKeyDown,
  isSingleSelect,
  visibleItems,
  groupedItems,
  renderOption,
  notFoundComponent,
  selectedCount,
  onClear,
}: IPanelProps) => (
  <div
    ref={panelRef}
    style={style}
    className="z-[1400] flex flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl animate-fade-in"
    onKeyDown={onKeyDown}
  >
    {title ? (
      <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">{title}</div>
    ) : null}
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        placeholder={label ? `Search ${label.toLowerCase()}` : 'Search'}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        autoFocus
      />
      {searchTerm ? (
        <button
          type="button"
          aria-label="Clear search"
          className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          onClick={() => onSearchChange('')}
        >
          <XIcon weight="bold" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
    <div id={listboxId} role="listbox" aria-multiselectable={!isSingleSelect} className="overflow-y-auto p-1">
      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-3">
          <BlankState
            label={searchTerm ? 'No matches' : 'Nothing to choose from'}
            iconSize="h-5 w-5"
            className="py-2"
          />
          {notFoundComponent}
        </div>
      ) : null}
      {groupedItems
        ? [...groupedItems.entries()].map(([group, items]) => (
            <div key={group}>
              <div className="px-2.5 pb-1 pt-2 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
                {group}
              </div>
              {items.map(renderOption)}
            </div>
          ))
        : visibleItems.map(renderOption)}
    </div>
    {!isSingleSelect && selectedCount > 0 ? (
      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
        <span>{selectedCount} selected</span>
        <button type="button" className="font-medium text-primary hover:underline" onClick={onClear}>
          Clear
        </button>
      </div>
    ) : null}
  </div>
);

/**
 * A single- or multi-select with search, grouping and keyboard navigation.
 *
 * The trigger reads as an input — label above, placeholder, one chip per selected value — and the
 * list opens in a portal positioned against it, so it is never clipped by the scrolling body of a
 * drawer or a table cell. It flips above the trigger when there is no room below.
 *
 * `onChange` fires on every change with the full selection, so a caller patches its store directly.
 * A value of `ALL` in the items is the "everything" choice: picking it clears the selection.
 */
export const Select = ({
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  const selectedItems = React.useMemo(() => items.filter((item) => values.includes(item.value)), [items, values]);

  const visibleItems = React.useMemo(() => {
    const base = isGrouped || noSort ? items : sortSelectedFirst(items, values);
    const term = searchTerm.trim().toLowerCase();
    return term ? base.filter((item) => matchesSearch(item, term)) : base;
  }, [items, isGrouped, noSort, values, searchTerm]);

  const groupedItems = React.useMemo(() => (isGrouped ? groupItems(visibleItems) : null), [visibleItems, isGrouped]);

  const close = React.useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  const open = () => {
    if (isDisabled) return;
    setActiveIndex(0);
    setIsOpen(true);
  };

  const panelStyle = usePanelPlacement(isOpen, triggerRef, panelRef, {
    itemCount: visibleItems.length,
    minWidth: Boolean(withInPortal),
  });
  useCloseOnOutside(isOpen, triggerRef, panelRef, close);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

  const isSelected = (item: ISelectItem) => values.includes(item.value);

  const select = (item: ISelectItem) => {
    if (isSingleSelect || item.value === ALL) {
      onChange(item.value === ALL ? [] : [item]);
      close();
      return;
    }
    const next = isSelected(item)
      ? selectedItems.filter((selected) => selected.value !== item.value)
      : [...selectedItems, item];
    onChange(next);
    if (isCloseOnSelect) close();
  };

  const remove = (item: ISelectItem) => {
    onChange(selectedItems.filter((selected) => selected.value !== item.value));
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (isOpen && event.key === 'Escape') {
      // Same contract as the panel: a handled Escape closes the list, not the dialog around it.
      event.preventDefault();
      close();
    } else if (OPEN_KEYS.includes(event.key)) {
      event.preventDefault();
      open();
    }
  };

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    const step = ARROW_STEPS[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(Math.max(index + step, 0), visibleItems.length - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = visibleItems[activeIndex];
      if (item) select(item);
    } else if (event.key === 'Escape') {
      // Handled here: the enclosing Modal skips an Escape that has been `preventDefault`ed, so this
      // closes the list and leaves the drawer open.
      event.preventDefault();
      event.stopPropagation();
      close();
      triggerRef.current?.focus();
    }
  };

  const renderOption = (item: ISelectItem) => (
    <SelectOption
      key={item.value}
      item={item}
      isSelected={isSelected(item)}
      isActive={visibleItems[activeIndex]?.value === item.value}
      onHover={() => setActiveIndex(visibleItems.indexOf(item))}
      onSelect={() => select(item)}
    />
  );

  const hasSelection = selectedItems.length > 0;

  return (
    <div className={cn('w-full', className)}>
      {label && <Label label={label} required={required} />}
      <button
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={isOpen ? close : open}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'flex min-h-[2.5rem] w-full items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-left text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          isOpen ? 'border-primary' : 'border-border hover:bg-accent/50',
          isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        {leftsection ? <span className="shrink-0 text-muted-foreground">{leftsection}</span> : null}
        <span className="min-w-0 flex-1">
          {hasSelection ? (
            <SelectedChips
              items={selectedItems}
              isSingleSelect={isSingleSelect}
              isDisabled={isDisabled}
              onRemove={remove}
            />
          ) : (
            <span className="text-muted-foreground">
              {placeholder || (label ? `Select ${capitalize(label)}` : 'Select')}
            </span>
          )}
        </span>
        {rightsection ?? (
          <CaretDownIcon
            weight="bold"
            className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
          />
        )}
      </button>
      {isOpen &&
        createPortal(
          <SelectPanel
            panelRef={panelRef}
            style={panelStyle}
            listboxId={listboxId}
            title={title}
            label={label}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onKeyDown={onPanelKeyDown}
            isSingleSelect={isSingleSelect}
            visibleItems={visibleItems}
            groupedItems={groupedItems}
            renderOption={renderOption}
            notFoundComponent={notFoundComponent}
            selectedCount={selectedItems.length}
            onClear={() => onChange([])}
          />,
          document.body,
        )}
    </div>
  );
};
