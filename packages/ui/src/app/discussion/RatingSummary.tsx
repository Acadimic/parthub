import { StarIcon } from '@phosphor-icons/react';
import { type ICourseRating } from '@repo/shared/interfaces';
import { RatingStars } from './RatingStars';

/** The average, the number of reviews, and a bar per star showing how the ratings spread. */
export const RatingSummary = ({ rating }: { rating: ICourseRating }) => {
  const { average, count, distribution } = rating;
  return (
    <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-4">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <span className="text-4xl font-bold leading-none tracking-tight">{count ? average.toFixed(1) : '–'}</span>
        <RatingStars value={average} className="h-3.5" />
        <span className="text-xxs text-muted-foreground">
          {count} {count === 1 ? 'review' : 'reviews'}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const starCount = distribution[star - 1] ?? 0;
          const percent = count ? (starCount / count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xxs text-muted-foreground">
              <span className="flex w-5 shrink-0 items-center gap-0.5 font-mono">
                {star}
                <StarIcon weight="fill" className="h-2.5 w-2.5" />
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-warning transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-mono">{starCount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
