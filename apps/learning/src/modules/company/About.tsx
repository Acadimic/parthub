import { Link } from '@repo/ui/app';
import { Band, SectionHeading } from '@components/app/sections';
import { Container } from '@components/others';
import {
  ArrowUpRightIcon,
  CalendarCheckIcon,
  ChalkboardTeacherIcon,
  ChartBarIcon,
  EyeIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import { COMPANY } from '@utils/constants';

const PRINCIPLES = [
  {
    icon: CalendarCheckIcon,
    title: 'A course is a plan',
    body: 'Every course is laid out day by day before a single lesson is written. You always know what is next and how much of the week is left.',
  },
  {
    icon: ChartBarIcon,
    title: 'Marks you can trust',
    body: 'Practice shows you the answer straight away. A test is timed, marked on our servers against the teacher’s key, and every attempt is kept.',
  },
  {
    icon: ChalkboardTeacherIcon,
    title: 'Teachers own their courses',
    body: 'The people who publish here keep their content and their students. We provide the platform, the marking and the catalogue; they provide the teaching.',
  },
  {
    icon: SparkleIcon,
    title: 'AI assists, teachers decide',
    body: 'A teacher can draft an outline, lessons and quizzes with an AI model of their choice. Every draft is reviewed by that teacher before publication, and the course says so.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Learners’ data stays theirs',
    body: 'No advertising, no tracking, no profiling. Nothing a learner does here is used to train a model, and progress is shown only to them, their parent and their teacher.',
  },
  {
    icon: EyeIcon,
    title: 'Nothing hidden',
    body: 'Prices are on the course before you start. Policies are written in plain language. If something is a placeholder, it is labelled as one.',
  },
];

const HOW_COURSES_ARE_MADE = [
  {
    step: '01',
    title: 'Planned against the syllabus',
    body: 'A teacher sets the standard, subjects, weeks and pace. The plan lays the syllabus across the days, easy to hard within each week, reusing lessons and tests the teacher already has.',
  },
  {
    step: '02',
    title: 'Written, or drafted then reviewed',
    body: 'Lessons and quizzes are written by the teacher, or drafted by an AI model from a prompt the teaching app prepares and then corrected by the teacher. Cited references are checked for reachability as they come in.',
  },
  {
    step: '03',
    title: 'Reviewed and published',
    body: 'A coverage and pace review flags gaps before publishing. The course then appears in the catalogue under its standards and subjects, marked as AI-assisted where it is.',
  },
];

/** Who we are, what we believe, and how a course gets made. */
export const About = () => (
  <div className="flex flex-col">
    <Band className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <div className="py-12 md:py-20">
        <div className="text-xs font-semibold uppercase tracking-caps text-primary">About {COMPANY.name}</div>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
          A place where a course is a plan, and a score means something.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
          {COMPANY.name} is a marketplace for academic courses. Teachers and institutions publish day-by-day courses for
          the class or exam a learner is preparing for; learners work through them, practise, sit marked tests and watch
          their progress add up.
        </p>
      </div>
    </Band>
    <Container>
      <section className="flex flex-col gap-8 py-12 md:py-16">
        <SectionHeading
          eyebrow="What we believe"
          title="Six things every course here is held to"
          subtitle="They shape what the product does, and what it refuses to do."
          action={null}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="flex gap-4 rounded-xl border border-border bg-muted/30 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                <principle.icon weight="bold" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">{principle.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{principle.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Container>
    <Band className="border-y border-border bg-muted/30">
      <section className="flex flex-col gap-8 py-12 md:py-16">
        <SectionHeading
          eyebrow="How a course is made"
          title="From syllabus to catalogue"
          subtitle="The same path whether a teacher writes every word or drafts with an AI model first."
          action={null}
        />
        <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {HOW_COURSES_ARE_MADE.map((item) => (
            <li key={item.step} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5">
              <span className="font-mono text-xs text-muted-foreground">{item.step}</span>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
        <p className="max-w-3xl text-sm text-muted-foreground">
          How AI-assisted content, third-party references and copyright are handled is set out in the{' '}
          <Link href="/terms" isSubtle className="px-1 py-0 text-sm text-primary">
            Terms of Service
          </Link>
          , and what we do with data in the{' '}
          <Link href="/privacy" isSubtle className="px-1 py-0 text-sm text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </Band>
    <Container>
      <section className="grid grid-cols-1 gap-6 py-12 md:grid-cols-2 md:py-16">
        <div className="flex flex-col gap-3 rounded-2xl border border-border p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-caps text-primary">For learners</div>
          <h2 className="text-xl font-semibold">Start with your standard</h2>
          <p className="text-sm text-muted-foreground">
            Find the courses catalogued under your class or exam, preview the plan, and begin for free.
          </p>
          <Link href="/courses" className="mt-2 w-fit px-5 py-2.5">
            Browse courses
          </Link>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
          <div className="text-xs font-semibold uppercase tracking-caps opacity-80">For teachers</div>
          <h2 className="text-xl font-semibold">Publish a course learners can follow</h2>
          <p className="text-sm opacity-90">
            Plan by day, write or draft with AI, let the platform mark every paper, and reach learners across
            organisations.
          </p>
          <Link
            href={COMPANY.teachUrl}
            target="_blank"
            className="mt-2 w-fit bg-background px-5 py-2.5 text-foreground hover:bg-background/90"
            rightsection={<ArrowUpRightIcon weight="bold" className="h-4 w-4" />}
          >
            Open the teaching app
          </Link>
        </div>
      </section>
    </Container>
  </div>
);
