import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { Avatar } from '@components/app/avatars';
import { StarIcon } from '@phosphor-icons/react';
import { type ITestimonial } from '../testimonials';
import { SectionHeading } from './SectionHeading';

const Stars = ({ rating, className }: { rating: number; className?: string }) => (
  <div className={cn('flex items-center gap-0.5', className)} aria-label={`${rating} out of 5`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <StarIcon key={index} weight="fill" className={cn('h-4 w-4', index < rating ? 'text-warning' : 'text-border')} />
    ))}
  </div>
);

const Card = ({ testimonial, isFeatured }: { testimonial: ITestimonial; isFeatured: boolean }) => (
  <figure
    className={cn(
      'flex h-full flex-col gap-4 rounded-xl border border-border bg-background p-5 md:p-6',
      isFeatured && 'xl:col-span-2 xl:row-span-2 xl:justify-between xl:p-8',
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <Stars rating={testimonial.rating} />
      <Badge tone="neutral" appearance="outline" className="shrink-0">
        {testimonial.context}
      </Badge>
    </div>
    {/* The featured quote sits in the middle of its taller cell rather than hugging the top. */}
    <blockquote
      className={cn(
        'text-sm leading-relaxed text-foreground',
        isFeatured && 'xl:my-auto xl:text-2xl xl:leading-relaxed',
      )}
    >
      {testimonial.quote}
    </blockquote>
    <figcaption className="mt-auto flex items-center gap-3 pt-2">
      <Avatar id={testimonial.id} name={testimonial.name} avatar={testimonial.avatar} isStatic="static" size={40} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{testimonial.name}</div>
        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
      </div>
    </figcaption>
  </figure>
);

/**
 * A wall of learner quotes with the first one featured, and a rating summary worked out from the
 * quotes on show. On a phone the wall becomes a row that snaps card by card.
 */
export const Testimonials = ({ testimonials }: { testimonials: ITestimonial[] }) => {
  const average = testimonials.length
    ? testimonials.reduce((sum, testimonial) => sum + testimonial.rating, 0) / testimonials.length
    : 0;

  return (
    <section className="flex flex-col gap-8 py-12 md:py-16">
      <SectionHeading
        eyebrow="Learners"
        title="What students say"
        subtitle="School to university, exam prep to olympiads, from Kota to Manila, and the teachers who publish here."
        action={null}
      />
      {testimonials.length ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Stars rating={Math.round(average)} />
          <span className="font-mono font-semibold">{average.toFixed(1)}</span>
          <span className="text-muted-foreground">
            average across {testimonials.length} {testimonials.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      ) : null}
      {/* One scrolling row below `md`, a grid above it, with the first quote taking a 2×2 cell on wide screens. */}
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
        {testimonials.map((testimonial, index) => (
          <li
            key={testimonial.id}
            className={cn('w-[85%] shrink-0 snap-center md:w-auto', index === 0 && 'xl:col-span-2 xl:row-span-2')}
          >
            <Card testimonial={testimonial} isFeatured={index === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
};
