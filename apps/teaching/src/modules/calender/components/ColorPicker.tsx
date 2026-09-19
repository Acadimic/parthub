import { CheckIcon } from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';
import { ColorType } from '@enums';
import { getEventColor } from '@themes';
import { capitalize } from '@utils/helpers';

interface IProps {
  value?: ColorType;
  onChange: (color: ColorType) => void;
  isDisabled?: boolean;
}

/** The session's calendar colour as a row of swatches: what a dropdown of circles was trying to be. */
export const ColorPicker = ({ value, onChange, isDisabled }: IProps) => {
  const mode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
      {Object.values(ColorType).map((color) => {
        const isActive = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={capitalize(color)}
            disabled={isDisabled}
            onClick={() => onChange(color)}
            style={{ backgroundColor: getEventColor(mode, color) }}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
              isActive && 'ring-2 ring-foreground/60',
            )}
          >
            {isActive ? <CheckIcon weight="bold" className="h-3.5 w-3.5" /> : null}
          </button>
        );
      })}
    </div>
  );
};
