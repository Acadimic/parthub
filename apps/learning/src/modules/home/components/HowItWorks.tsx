import { BookOpenTextIcon, ChartLineUpIcon, CompassIcon, ExamIcon } from '@phosphor-icons/react';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  {
    icon: CompassIcon,
    title: 'Pick a course',
    body: 'Filter the catalogue by your class or exam and subject, preview the outline, and start for free.',
  },
  {
    icon: BookOpenTextIcon,
    title: 'Learn day by day',
    body: 'Each course is planned as modules with readings, videos and live sessions, so you always know what is next.',
  },
  {
    icon: ExamIcon,
    title: 'Test yourself',
    body: 'Practise with instant answers, then sit timed papers that are marked the moment you submit.',
  },
  {
    icon: ChartLineUpIcon,
    title: 'Watch it add up',
    body: 'Your activity page keeps every lesson, score and streak, so progress is something you can see.',
  },
];

/** The four things a learner does here, in order. */
export const HowItWorks = () => (
  <section className="flex flex-col gap-8 py-12 md:py-16">
    <SectionHeading
      eyebrow="How it works"
      title="From first lesson to final score"
      subtitle="A course here is a plan, not a pile of videos. Here is the shape of it."
      action={null}
    />
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="relative flex flex-col gap-3 rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <step.icon weight="bold" className="h-5 w-5" />
            </span>
            <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
          </div>
          <h3 className="text-base font-semibold">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  </section>
);
