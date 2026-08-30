import { Container } from '@components/others';
import Link from 'next/link';
import React from 'react';
import { FullLogo } from '../../app/logos';

interface FooterSection {
  title: string;
  links: {
    text: string;
    href: string;
  }[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Company',
    links: [
      { text: 'About Us', href: '/about' },
      { text: 'Careers', href: '/careers' },
      { text: 'Blog', href: '/blog' },
      { text: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { text: 'Documentation', href: '/docs' },
      { text: 'Help Center', href: '/help' },
      { text: 'Community', href: '/community' },
      { text: 'Terms of Service', href: '/terms' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { text: 'For Students', href: '/students' },
      { text: 'For Teachers', href: '/teachers' },
      { text: 'For Institutions', href: '/institutions' },
      { text: 'Enterprise', href: '/enterprise' },
    ],
  },
];

export const PageFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-primary py-12 border-t border-color-border px-1">
      <Container>
        <div className="flex flex-wrap justify-between gap-8 w-full">
          {/* Logo and Description */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="mb-6">
              <FullLogo className="h-6" />
            </div>
            <p className="text-sm mb-4">
              Empowering education through innovative learning solutions. Join us in transforming the way people learn
              and grow.
            </p>
          </div>

          {/* Footer Sections */}
          <div className="flex flex-wrap flex-1 md:justify-end gap-4 sm:gap-0 md:gap-8 lg:gap-24">
            {footerSections.map((section) => (
              <div key={section.title} className="w-auto sm:w-auto">
                <h3 className="text-sm font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.text}>
                      <Link
                        href={link.href}
                        className="text-sm hover:opacity-90 transition-colors text-color-secondary font-medium"
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright and Bottom Links */}
        <div className="mt-12 py-6 border-t border-color-border flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm">© {currentYear} Acadimic. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <a href="/privacy" className="text-sm hover:opacity-90 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm hover:opacity-90 transition-colors">
              Terms of Service
            </a>
            <a href="/cookies" className="text-sm hover:opacity-90 transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default PageFooter;
