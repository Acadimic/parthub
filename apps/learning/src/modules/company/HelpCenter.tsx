import { Accordion, TextInput } from '@repo/ui/core';
import { Band, SectionHeading } from '@components/app/sections';
import { BlankState, Container } from '@components/others';
import {
  BookOpenTextIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  CompassIcon,
  GearSixIcon,
  type Icon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { COMPANY } from '@utils/constants';
import { useState } from 'react';
import { HELP_TOPICS, type IHelpTopic } from './help.content';

const TOPIC_ICONS: Record<string, Icon> = {
  'getting-started': CompassIcon,
  courses: BookOpenTextIcon,
  tests: ClipboardTextIcon,
  sessions: VideoCameraIcon,
  activity: ChartLineUpIcon,
  account: GearSixIcon,
  teachers: UserCircleIcon,
  safety: ShieldCheckIcon,
};

/** The topics with only the entries that match, so a search narrows every group at once. */
const filterTopics = (topics: IHelpTopic[], query: string): IHelpTopic[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return topics;
  return topics
    .map((topic) => ({
      ...topic,
      entries: topic.entries.filter(
        (entry) => entry.question.toLowerCase().includes(needle) || entry.answer.toLowerCase().includes(needle),
      ),
    }))
    .filter((topic) => topic.entries.length > 0);
};

/** Searchable answers, grouped by where in the product the question comes up. */
export const HelpCenter = () => {
  const [query, setQuery] = useState('');
  const topics = filterTopics(HELP_TOPICS, query);
  const total = HELP_TOPICS.reduce((sum, topic) => sum + topic.entries.length, 0);

  return (
    <div className="flex flex-col">
      <Band className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
        <div className="py-12 md:py-16">
          <div className="text-xs font-semibold uppercase tracking-caps text-primary">Help Center</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">How can we help?</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">
            {total} answers on courses, tests, sessions, your account and how the platform treats your data.
          </p>
          <div className="mt-6 max-w-xl">
            <TextInput
              type="search"
              value={query}
              placeholder="Search, e.g. refund, streak, negative marking…"
              aria-label="Search help"
              inputClassName="py-2.5 text-base"
              leftSection={<MagnifyingGlassIcon weight="bold" className="h-5 w-5 text-muted-foreground" />}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {!query ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {HELP_TOPICS.map((topic) => (
                <a
                  key={topic.id}
                  href={`#${topic.id}`}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary"
                >
                  {topic.title}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </Band>
      <Container>
        <div className="flex flex-col gap-10 py-10 md:py-14">
          {topics.length ? (
            topics.map((topic) => {
              const TopicIcon = TOPIC_ICONS[topic.id] ?? CompassIcon;
              return (
                <section
                  key={topic.id}
                  id={topic.id}
                  className="grid scroll-mt-24 grid-cols-1 gap-4 lg:grid-cols-[260px_1fr] lg:gap-10"
                >
                  <div className="flex items-start gap-3 lg:sticky lg:top-24 lg:self-start">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TopicIcon weight="bold" className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold">{topic.title}</h2>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background px-2">
                    <Accordion
                      type="single"
                      openIndexes={[]}
                      items={topic.entries.map((entry) => ({
                        title: entry.question,
                        component: (
                          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{entry.answer}</p>
                        ),
                      }))}
                    />
                  </div>
                </section>
              );
            })
          ) : (
            <BlankState
              className="py-16"
              label={`Nothing matches “${query.trim()}”`}
              description="Try another word, or write to us and we will answer directly."
            />
          )}
          <div className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
            <SectionHeading
              eyebrow="Still stuck?"
              title="Write to us"
              subtitle={`Email ${COMPANY.supportEmail} from the address on your account, or use the contact page for the right team.`}
              action={{ label: 'Contact us', href: '/contact' }}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};
