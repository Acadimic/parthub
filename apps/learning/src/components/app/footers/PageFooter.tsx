import { FullLogo } from '@repo/ui/app';
import { Container } from '@components/others';
import { ArrowUpRightIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { COMPANY } from '@utils/constants';
import Link from 'next/link';

interface IFooterLink {
  text: string;
  href: string;
  /** Opens in a new tab and carries the outward arrow. */
  isExternal: boolean;
}

interface IFooterSection {
  title: string;
  links: IFooterLink[];
}

/** Every route here resolves to a page; the columns list only what exists. */
const SECTIONS: IFooterSection[] = [
  {
    title: 'Learn',
    links: [
      { text: 'Courses', href: '/courses', isExternal: false },
      { text: 'Live sessions', href: '/sessions', isExternal: false },
      { text: 'Your activity', href: '/activity', isExternal: false },
      { text: 'Help Center', href: '/help', isExternal: false },
    ],
  },
  {
    title: 'Company',
    links: [
      { text: 'About us', href: '/about', isExternal: false },
      { text: 'Contact us', href: '/contact', isExternal: false },
      { text: 'Teach on Acadimic', href: COMPANY.teachUrl, isExternal: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { text: 'Privacy Policy', href: '/privacy', isExternal: false },
      { text: 'Terms of Service', href: '/terms', isExternal: false },
      { text: 'Cookie Policy', href: '/cookies', isExternal: false },
    ],
  },
];

const FooterLink = ({ link }: { link: IFooterLink }) => (
  <Link
    href={link.href}
    target={link.isExternal ? '_blank' : undefined}
    rel={link.isExternal ? 'noreferrer' : undefined}
    className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
  >
    {link.text}
    {link.isExternal ? <ArrowUpRightIcon weight="bold" className="h-3.5 w-3.5" /> : null}
  </Link>
);

export const PageFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <Container>
        {/* The brand block takes its own row on a tablet and a wide first column on a desktop, with a clear
            gap before the link columns either way. */}
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-3 md:gap-x-8 md:gap-y-12 md:py-16 lg:grid-cols-[1.1fr_repeat(3,0.7fr)] lg:gap-x-28 xl:gap-x-36">
          <div className="max-w-xs md:col-span-3 lg:col-span-1">
            <FullLogo className="h-7" />
            <p className="mt-4 text-sm text-muted-foreground">
              Day-by-day courses with readings, videos, live sessions and marked test papers, built by teachers for the
              standard you are studying.
            </p>
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <EnvelopeSimpleIcon weight="bold" className="h-4 w-4" />
              {COMPANY.supportEmail}
            </a>
          </div>
          {SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-caps text-muted-foreground">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.text}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY.legalName}. All rights reserved.
          </p>
          <p>
            Courses may be prepared with AI assistance and are reviewed by their teachers. See the Terms of Service.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default PageFooter;
