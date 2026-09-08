import { type IMenuItem } from '../../types';

export const MenuList = <T,>({ menuItems, data }: { menuItems: IMenuItem<T>[]; data?: T }) => {
  return (
    <>
      {menuItems.map((item, index) => {
        const isLastItem = index === menuItems.length - 1;
        return (
          <div key={index}>
            <button
              onClick={() => item.onClick(data)}
              className={`w-full flex items-center gap-2 hover:text-blue-primary hover:bg-transparent py-3 px-4 text-sm font-medium ${
                item.isCurrent ? 'text-blue-primary' : ''
              } ${!isLastItem ? 'border-b border-color-border' : ''}`}
            >
              <span className="text-inherit w-5 flex-shrink-0">{item.icon}</span>
              {item.label}
            </button>
          </div>
        );
      })}
    </>
  );
};
