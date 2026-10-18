import { type IMenuItem, type MenuItemValue } from '../../types';

/** A menu item's label or icon: the value as given, or what it reads off the row. */
const resolve = <T, V>(value: MenuItemValue<T, V>, data?: T): V =>
  typeof value === 'function' ? (value as (row?: T) => V)(data) : value;

export const MenuList = <T,>({ menuItems, data }: { menuItems: IMenuItem<T>[]; data?: T }) => {
  return (
    <>
      {menuItems.map((item, index) => {
        const isLastItem = index === menuItems.length - 1;
        const label = resolve(item.label, data);
        return (
          <div key={index}>
            <button
              onClick={() => item.onClick(data)}
              // On the whole row, so the icon names the item too; the label itself is trimmed to one line.
              title={typeof label === 'string' ? label : undefined}
              className={`w-full flex items-center gap-2 hover:text-primary hover:bg-transparent py-3 px-4 text-sm font-medium ${
                item.isCurrent ? 'text-primary' : ''
              } ${!isLastItem ? 'border-b border-border' : ''}`}
            >
              <span className="text-inherit w-5 flex-shrink-0">{item.icon ? resolve(item.icon, data) : null}</span>
              {/* One line, trimmed: a long lesson or file name ends in an ellipsis. */}
              <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            </button>
          </div>
        );
      })}
    </>
  );
};
