import { Band } from '@components/app/sections';
import { Container } from '@components/others';
import { COMPANY } from '@utils/constants';
import { getStringFormattedDate } from '@utils/helpers';
import { CaretDownIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';

export interface ILegalSection {
  /** The anchor, so a section can be linked to from elsewhere. */
  id: string;
  title: string;
  body: ReactNode;
}

interface IProps {
  eyebrow: string;
  title: string;
  /** A plain-language line under the title saying what the document covers. */
  summary: string;
  sections: ILegalSection[];
}

/** The three policies, linked from each other's header. */
const POLICIES = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Policy' },
];

/** The section in view, so the table of contents can mark it. */
const useActiveSection = (ids: string[]) => {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ids.join(',')]);
  return active;
};

/**
 * A policy page: a header with the date it took effect, a table of contents that follows the
 * reader on wide screens, and the sections as an article. The prose is styled here so every
 * policy reads the same.
 */
export const LegalDocument = ({ eyebrow, title, summary, sections }: IProps) => {
  const active = useActiveSection(sections.map((section) => section.id));

  return (
    <div className="flex flex-col">
      <Band className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
        <div className="py-12 md:py-16">
          <div className="text-xs font-semibold uppercase tracking-caps text-primary">{eyebrow}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">{summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>Effective {getStringFormattedDate(COMPANY.policiesEffectiveFrom)}</span>
            <span aria-hidden="true">·</span>
            {POLICIES.map((policy) => (
              <Link
                key={policy.href}
                href={policy.href}
                className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                {policy.label}
              </Link>
            ))}
          </div>
        </div>
      </Band>
      <Container>
        <div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-[260px_1fr] lg:gap-16 lg:py-14">
          {/* Folded on a phone, where fourteen entries would push the text a screen down; always open beside it on a wide screen. */}
          <details className="group rounded-lg border border-border px-4 py-3 open:pb-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
              On this page
              <CaretDownIcon weight="bold" className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <ol className="mt-3 flex flex-col gap-1 border-l border-border">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-muted-foreground"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
          <nav aria-label="On this page" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="mb-3 text-xs font-semibold uppercase tracking-caps text-muted-foreground">On this page</div>
            <ol className="flex flex-col gap-1 border-l border-border">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={active === section.id ? 'location' : undefined}
                    className={
                      active === section.id
                        ? '-ml-px block border-l-2 border-primary py-1 pl-3 text-sm font-medium text-primary'
                        : '-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-muted-foreground hover:text-foreground'
                    }
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="min-w-0 max-w-3xl [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 border-b border-border py-8 first:pt-0 last:border-b-0"
              >
                <h2 className="mb-4 text-xl font-semibold tracking-tight">
                  <span className="mr-2 font-mono text-sm text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </h2>
                <div className="flex flex-col gap-3">{section.body}</div>
              </section>
            ))}
          </article>
        </div>
      </Container>
    </div>
  );
};
