import NextLink from 'next/link';
import { type HTMLAttributeAnchorTarget } from 'react';
import { type IButtonProps, getButtonClass, getSectionPadding } from '../buttons';
import { Spinner } from '../loaders/Spinner';

interface IProps extends IButtonProps {
  href: string;
  children: React.ReactNode;
  linkClassName?: string;
  target?: HTMLAttributeAnchorTarget;
  /** Classes for the label's wrapper; see `Button`. */
  labelClassName?: string;
}

/**
 * A client-side link that looks like a `Button`.
 *
 * One element, the anchor, carries both the navigation and the button styling. It used to render a
 * `<Button>` inside the anchor; Next's link handler ignores a click that lands on a nested button,
 * so every click on the visible text fell through to the browser and reloaded the whole page.
 * `disabled` on an anchor is `aria-disabled` plus no pointer events — there is no native attribute.
 */
export const Link = ({
  href,
  children,
  text,
  linkClassName,
  target,
  isRound,
  isSecondary,
  isSubtle,
  isDestructive,
  isLoading,
  isFull,
  disabled,
  hideLoadingIcon,
  leftsection,
  rightsection,
  className,
  labelClassName,
}: IProps) => {
  const isInert = disabled || isLoading;
  const label = text || children;
  return (
    <NextLink
      href={href}
      target={target}
      aria-disabled={isInert || undefined}
      tabIndex={isInert ? -1 : undefined}
      onClick={isInert ? (event) => event.preventDefault() : undefined}
      className={`${linkClassName ?? ''} ${getButtonClass({ isRound, isSecondary, isSubtle, isDestructive, isLoading, isFull, className })} inline-flex items-center justify-center gap-2.5 no-underline ${isInert ? 'pointer-events-none opacity-50' : ''}`}
    >
      {leftsection ? <span className="flex items-center">{leftsection}</span> : null}
      {label ? (
        <span className={`text-inherit ${getSectionPadding(leftsection, rightsection)} ${labelClassName ?? ''}`}>
          {label}
        </span>
      ) : null}
      {isLoading && !hideLoadingIcon ? <Spinner /> : null}
      {!isLoading && rightsection ? <span className="flex items-center">{rightsection}</span> : null}
    </NextLink>
  );
};
