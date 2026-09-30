import { Spinner } from '../loaders/Spinner';

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  text?: string;
  isRound?: boolean;
  isSecondary?: boolean;
  isSubtle?: boolean;
  /** The red variant, for an action that deletes or cannot be undone. */
  isDestructive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  hideLoadingIcon?: boolean;
  leftsection?: React.ReactNode;
  rightsection?: React.ReactNode;
  className?: string;
  isFull?: boolean;
  /**
   * Classes for the label's wrapper. A label that hides itself below a breakpoint should hide
   * this wrapper rather than its own text, or its spacing stays behind and the icon sits off centre.
   */
  labelClassName?: string;
}

export type ButtonVariant = Pick<
  IButtonProps,
  'isRound' | 'isSecondary' | 'isSubtle' | 'isDestructive' | 'isLoading' | 'isFull' | 'className'
>;

const getVariantClass = ({ isSecondary, isSubtle, isDestructive }: ButtonVariant) => {
  if (isDestructive) {
    return 'bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90 hover:border-destructive/90';
  }
  if (isSecondary) return 'bg-background hover:bg-accent';
  if (isSubtle) return 'bg-transparent hover:bg-accent';
  return 'bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/90';
};

/**
 * The classes that make an element look like a `Button`. Exported for `Link`, which is an anchor
 * dressed as a button: a real `<button>` nested inside `<a>` is invalid HTML, and Next's link
 * handler ignores clicks that land on the nested button, so the browser does a full page load.
 */
export const getButtonClass = (variant: ButtonVariant) =>
  `${variant.className ?? 'px-3 md:px-4 py-1.5'} select-none text-sm font-semibold border transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:opacity-50 disabled:pointer-events-none
        ${variant.isRound ? 'rounded-full' : 'rounded-md'}
        ${getVariantClass(variant)}
        ${variant.isLoading ? 'opacity-80' : ''}
        ${variant.isSubtle ? 'border-transparent' : 'border-border'}
        ${variant.isFull ? 'w-full text-center' : ''}
      `;

export const getSectionPadding = (leftsection?: React.ReactNode, rightsection?: React.ReactNode) => {
  if (leftsection) return 'pr-1.5';
  if (rightsection) return 'pl-1.5';
  return '';
};

const TrailingSlot = ({
  isLoading,
  hideLoadingIcon,
  isFull,
  rightsection,
}: Pick<IButtonProps, 'isLoading' | 'hideLoadingIcon' | 'isFull' | 'rightsection'>) => {
  if (isLoading && !hideLoadingIcon) {
    return (
      <div className={`${isFull && isLoading ? 'flex-1 flex justify-center' : ''}`}>
        {/* The spinner takes the button's text colour: a primary spinner on a primary fill is invisible. */}
        <Spinner className="border-current border-t-transparent" />
      </div>
    );
  }
  if (rightsection) return <div className="flex items-center">{rightsection}</div>;
  return null;
};

export const Button = ({
  children,
  text,
  onClick,
  isRound,
  isSecondary,
  isLoading,
  disabled,
  isSubtle,
  hideLoadingIcon,
  leftsection,
  rightsection,
  className,
  isFull,
  isDestructive,
  labelClassName,
  ...rest
}: IButtonProps) => {
  // An icon-only button renders no label slot at all: the slot's spacing and padding are what put
  // a gap after the icon and pushed it off centre.
  const label = text || children;
  return (
    <button
      // Everything else — `title`, `aria-*`, `id`, `form` — reaches the element. Without this an
      // icon-only button had no accessible name, whatever the caller passed.
      {...rest}
      className={getButtonClass({ isRound, isSecondary, isSubtle, isDestructive, isLoading, isFull, className })}
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <div className="flex items-center justify-center gap-2.5">
        {leftsection ? <div className="flex items-center">{leftsection}</div> : null}
        {label ? (
          <div
            className={`text-inherit ${isFull && isLoading ? 'hidden' : 'flex-1'} ${getSectionPadding(leftsection, rightsection)} ${labelClassName ?? ''}`}
          >
            {label}
          </div>
        ) : null}
        <TrailingSlot
          isLoading={isLoading}
          hideLoadingIcon={hideLoadingIcon}
          isFull={isFull}
          rightsection={rightsection}
        />
      </div>
    </button>
  );
};
