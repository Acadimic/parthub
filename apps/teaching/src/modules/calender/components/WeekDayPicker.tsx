import { cn } from '@repo/ui/lib';
import { WEEK_DAYS_INTEGER_MAPPINGS } from '@repo/shared/utils';

interface IProps {
  value: number[];
  onChange: (weekDays: number[]) => void;
  isDisabled?: boolean;
}

const DAYS = Object.keys(WEEK_DAYS_INTEGER_MAPPINGS).map(Number);

/** The seven weekdays as toggles, in calendar order, so a pattern is set by tapping rather than from a dropdown. */
export const WeekDayPicker = ({ value, onChange, isDisabled }: IProps) => {
  const toggle = (day: number) => {
    const next = value.includes(day) ? value.filter((item) => item !== day) : [...value, day];
    onChange(next.sort((a, b) => a - b));
  };
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Repeat on">
      {DAYS.map((day) => {
        const isOn = value.includes(day);
        const name = WEEK_DAYS_INTEGER_MAPPINGS[String(day)];
        return (
          <button
            key={day}
            type="button"
            aria-pressed={isOn}
            title={name}
            disabled={isDisabled}
            onClick={() => toggle(day)}
            className={cn(
              'h-9 w-11 rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
              isOn
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {name.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
};
