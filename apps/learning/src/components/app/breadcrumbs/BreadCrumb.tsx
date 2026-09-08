import { Link, Menu } from '@components/app';
import { CaretRightIcon, DotsThreeIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/router';
import * as React from 'react';

export interface IBreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface IProps {
  items: IBreadcrumbItem[];
}

const BreadcrumbItem = ({ item }: { item: IBreadcrumbItem }) => {
  return (
    <div key={item.label}>
      <Link
        onClick={item.onClick ? item.onClick : undefined}
        isSubtle
        className="px-0.5 text-xs"
        href={item.href}
        leftsection={item.icon}
      >
        {item.label}
      </Link>
    </div>
  );
};

export const Breadcrumb = ({ items }: IProps) => {
  const { push } = useRouter();

  const isMoreItems = items.length > 4;
  const threshold = 2;

  const renderItems = () => {
    const result: React.ReactNode[] = [];
    const visibleStart = items.slice(0, isMoreItems ? threshold : items.length);

    visibleStart.forEach((item, i) => {
      if (i > 0) result.push(<CaretRightIcon key={`sep-${i}`} className="w-4 h-4 text-color-secondary mx-1" />);
      result.push(<BreadcrumbItem key={item.label} item={item} />);
    });

    if (isMoreItems) {
      result.push(<CaretRightIcon key="sep-more" className="w-4 h-4 text-color-secondary mx-1" />);
      result.push(
        <div key="more">
          <Menu
            menuItems={[...items.slice(threshold, items.length - threshold)].map((item) => ({
              label: item.label,
              onClick: () => push(item.href),
              icon: item.icon,
            }))}
            component={<DotsThreeIcon weight="bold" className="w-5 h-5 cursor-pointer" />}
          />
        </div>,
      );

      items.slice(items.length - threshold, items.length).forEach((item, i) => {
        result.push(<CaretRightIcon key={`sep-end-${i}`} className="w-4 h-4 text-color-secondary mx-1" />);
        result.push(<BreadcrumbItem key={item.label} item={item} />);
      });
    }

    return result;
  };

  return (
    <nav aria-label="breadcrumbs">
      <ol className="flex items-center flex-wrap">{renderItems()}</ol>
    </nav>
  );
};
