import { StarIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';
import { useState } from 'react';

const STARS = [1, 2, 3, 4, 5];

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** A rating drawn as five stars; a fractional value fills the last star part-way. */
export const RatingStars = ({ value, className }: { value: number; className?: string }) => (
  <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
    {STARS.map((star) => {
      const fill = Math.max(0, Math.min(1, value - star + 1));
      return (
        <span key={star} className="relative inline-flex">
          <StarIcon weight="fill" className="h-full w-full text-muted-foreground/30" />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
            <StarIcon weight="fill" className="h-full w-full text-warning" />
          </span>
        </span>
      );
    })}
  </span>
);

/** Five stars to pick a rating from, previewing the one under the pointer and naming it. */
export const RatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHovered(0)}>
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StarIcon
              weight={star <= shown ? 'fill' : 'regular'}
              className={cn('h-7 w-7', star <= shown ? 'text-warning' : 'text-muted-foreground/50')}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{RATING_LABELS[shown]}</span>
    </div>
  );
};
