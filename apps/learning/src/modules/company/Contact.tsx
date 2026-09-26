import { Band } from '@components/app/sections';
import { Container } from '@components/others';
import {
  ArrowUpRightIcon,
  ChalkboardTeacherIcon,
  CopyrightIcon,
  EnvelopeSimpleIcon,
  type Icon,
  LifebuoyIcon,
  ScalesIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';
import { COMPANY } from '@utils/constants';
import Link from 'next/link';

interface IChannel {
  icon: Icon;
  title: string;
  body: string;
  email: string;
  /** What to put in the message so it can be answered first time. */
  include: string;
}

const CHANNELS: IChannel[] = [
  {
    icon: LifebuoyIcon,
    title: 'Support',
    body: 'Anything about your account, a course, a test, a session or a payment.',
    email: COMPANY.supportEmail,
    include: 'The email on your account, the course or paper name, and what happened.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Privacy and data requests',
    body: 'See, correct or delete your data, withdraw a consent, or ask about a child’s account.',
    email: COMPANY.privacyEmail,
    include: 'Write from the email on the account so we can verify it is you.',
  },
  {
    icon: CopyrightIcon,
    title: 'Copyright and content complaints',
    body: 'Material you believe infringes your rights, or content that is unlawful or misleading.',
    email: COMPANY.copyrightEmail,
    include: 'The details listed in the Terms of Service under Copyright and other complaints.',
  },
  {
    icon: ScalesIcon,
    title: 'Legal notices',
    body: 'Formal notices to the company.',
    email: COMPANY.legalEmail,
    include: 'The matter, the parties, and any deadline.',
  },
  {
    icon: ChalkboardTeacherIcon,
    title: 'Teaching and partnerships',
    body: 'Publishing courses, bringing a school or coaching centre onto the platform.',
    email: COMPANY.supportEmail,
    include: 'Your organisation, the standards you teach, and how many learners.',
  },
];

/** Who to write to, and what to include so the first reply is the answer. */
export const Contact = () => (
  <div className="flex flex-col">
    <Band className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <div className="py-12 md:py-16">
        <div className="text-xs font-semibold uppercase tracking-caps text-primary">Contact us</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Write to the right team</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">
          We answer support within two working days, privacy requests within 30 days as the law sets, and complete
          copyright notices within 36 hours. Many questions are already answered in the{' '}
          <Link
            href="/help"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Help Center
          </Link>
          .
        </p>
      </div>
    </Band>
    <Container>
      <div className="grid grid-cols-1 gap-4 py-10 sm:grid-cols-2 md:py-14 lg:grid-cols-3">
        {CHANNELS.map((channel) => (
          <a
            key={channel.title}
            href={`mailto:${channel.email}`}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <channel.icon weight="bold" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold group-hover:text-primary">{channel.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{channel.body}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Include:</span> {channel.include}
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-primary">
              <EnvelopeSimpleIcon weight="bold" className="h-4 w-4" />
              {channel.email}
              <ArrowUpRightIcon
                weight="bold"
                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </span>
          </a>
        ))}
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">{COMPANY.legalName}</h2>
          <p>Grievance officer: {COMPANY.grievanceOfficer.name || 'to be appointed'}</p>
          <p>
            <a href={`mailto:${COMPANY.grievanceOfficer.email}`} className="text-primary hover:underline">
              {COMPANY.grievanceOfficer.email}
            </a>
          </p>
          <p>{COMPANY.postalAddress || COMPANY.country}</p>
        </div>
      </div>
    </Container>
  </div>
);
