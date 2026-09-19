import { cn } from '@repo/ui/lib';
import { type MeetFrequency } from '@enums';
import { MEET_FREQUENCIES, MEET_FREQUENCY_ORDER } from '@utils/constants';

interface IProps {
  value?: MeetFrequency;
  onChange: (frequency: MeetFrequency) => void;
  isDisabled?: boolean;
}

/** The frequencies as a grid of cards, each saying in a line what it does. Built from the table, so a new one appears here on its own. */
export const FrequencyPicker = ({ value, onChange, isDisabled }: IProps) => (
  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Repeats">
    {MEET_FREQUENCY_ORDER.map((frequency) => {
      const meta = MEET_FREQUENCIES[frequency];
      const isActive = frequency === value;
      return (
        <button
          key={frequency}
          type="button"
          role="radio"
          aria-checked={isActive}
          disabled={isDisabled}
          onClick={() => onChange(frequency)}
          className={cn(
            'flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-accent/50',
          )}
        >
          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
          <span className="text-xs leading-4 text-muted-foreground">{meta.description}</span>
        </button>
      );
    })}
  </div>
);
