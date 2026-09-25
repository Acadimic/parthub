import { Menu } from '../menus';
import { CaretRightIcon, DotsThreeIcon } from '@phosphor-icons/react';
import NextLink from 'next/link';
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

/** Past this many crumbs the middle ones fold into a menu, keeping the first and last two. */
const COLLAPSE_AFTER = 4;
const EDGE_COUNT = 2;

const Separator = () => (
  <li aria-hidden="true" className="shrink-0 text-muted-foreground/60">
    <CaretRightIcon weight="bold" className="h-3 w-3" />
  </li>
);

const Crumb = ({ item, isCurrent }: { item: IBreadcrumbItem; isCurrent: boolean }) => {
  const content = (
    <>
      {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
      <span className="truncate">{item.label}</span>
    </>
  );
  if (isCurrent) {
    return (
      <li className="min-w-0">
        <span
          aria-current="page"
          className="inline-flex max-w-[14rem] items-center gap-1 px-1 py-0.5 font-medium text-foreground md:max-w-[24rem]"
        >
          {content}
        </span>
      </li>
    );
  }
  return (
    <li className="min-w-0">
      <NextLink
        href={item.href}
        onClick={item.onClick}
        className="inline-flex max-w-[10rem] items-center gap-1 rounded-md px-1 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:max-w-[20rem]"
      >
        {content}
      </NextLink>
    </li>
  );
};

/**
 * Where the page sits. The last crumb is the page itself and is not a link; long labels truncate
 * rather than wrap, and on a narrow screen the trail scrolls sideways so it stays one line.
 */
export const Breadcrumb = ({ items }: IProps) => {
  const { push } = useRouter();
  const isCollapsed = items.length > COLLAPSE_AFTER;
  const head = isCollapsed ? items.slice(0, EDGE_COUNT) : items;
  const hidden = isCollapsed ? items.slice(EDGE_COUNT, items.length - EDGE_COUNT) : [];
  const tail = isCollapsed ? items.slice(items.length - EDGE_COUNT) : [];
  const last = items[items.length - 1];

  const renderCrumbs = (rows: IBreadcrumbItem[], withLeadingSeparator: boolean) =>
    rows.map((item, index) => (
      <React.Fragment key={`${item.label}-${index}`}>
        {index > 0 || withLeadingSeparator ? <Separator /> : null}
        <Crumb item={item} isCurrent={item === last} />
      </React.Fragment>
    ));

  return (
    <nav aria-label="breadcrumbs" className="min-w-0">
      <ol className="flex items-center gap-0.5 overflow-x-auto whitespace-nowrap text-xs [scrollbar-width:none] md:flex-wrap md:whitespace-normal [&::-webkit-scrollbar]:hidden">
        {renderCrumbs(head, false)}
        {isCollapsed ? (
          <>
            <Separator />
            <li className="shrink-0">
              <Menu
                menuItems={hidden.map((item) => ({
                  label: item.label,
                  onClick: () => push(item.href),
                  icon: item.icon,
                }))}
                component={
                  <span className="inline-flex items-center rounded-md px-1 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                    <DotsThreeIcon weight="bold" className="h-4 w-4" />
                  </span>
                }
              />
            </li>
            {renderCrumbs(tail, true)}
          </>
        ) : null}
      </ol>
    </nav>
  );
};
