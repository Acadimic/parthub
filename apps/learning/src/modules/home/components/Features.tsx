import {
  BookmarkSimpleIcon,
  CalendarCheckIcon,
  ChartBarIcon,
  ListChecksIcon,
  MoonStarsIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { SectionHeading } from './SectionHeading';

const FEATURES = [
  {
    icon: ListChecksIcon,
    title: 'Structured modules',
    body: 'Courses are laid out by day, with each lesson marked done as you go and a resume button that knows where you stopped.',
  },
  {
    icon: ChartBarIcon,
    title: 'Marked test papers',
    body: 'Single choice, multiple choice, numeric and written answers, marked on submit with a question-by-question breakdown.',
  },
  {
    icon: VideoCameraIcon,
    title: 'Live sessions',
    body: 'Scheduled classes sit inside the course plan, so a session is part of the week rather than a separate calendar.',
  },
  {
    icon: CalendarCheckIcon,
    title: 'Activity and streaks',
    body: 'A twelve-week view of what you did, your best and average scores, and every attempt in one sortable table.',
  },
  {
    icon: BookmarkSimpleIcon,
    title: 'Bookmarks and follows',
    body: 'Save a lesson or a question to come back to, and follow the teachers whose courses you rate.',
  },
  {
    icon: MoonStarsIcon,
    title: 'Works everywhere',
    body: 'Phone, tablet or desktop, light or dark, with maths rendered properly on all of them.',
  },
];

/** What the platform gives a learner, one card per capability. */
export const Features = () => (
  <section className="flex flex-col gap-8 py-12 md:py-16">
    <SectionHeading
      eyebrow="Why Acadimic"
      title="Built for studying, not just watching"
      subtitle="Everything on the platform exists to move you from a lesson to a score you can trust."
      action={null}
    />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="flex gap-4 rounded-xl border border-border bg-muted/30 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
            <feature.icon weight="bold" className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">{feature.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
