/**
 * Who stands behind the product, as the legal pages and the footer print it. Every address here
 * is the one to update when the company's details change; nothing else hard-codes them.
 */
export const COMPANY = {
  name: 'Acadimic',
  /** The registered entity named in the terms. */
  legalName: 'Acadimic',
  /** Blank until the registered office is published; the pages then omit the postal block. */
  postalAddress: '',
  country: 'India',
  supportEmail: 'support@acadimic.com',
  privacyEmail: 'privacy@acadimic.com',
  legalEmail: 'legal@acadimic.com',
  /** Copyright and other content complaints, under the IT Rules 2021 and the DMCA. */
  copyrightEmail: 'copyright@acadimic.com',
  /** The IT Rules 2021 require a named grievance officer; blank until one is appointed. */
  grievanceOfficer: { name: '', email: 'grievance@acadimic.com' },
  teachUrl: process.env.NEXT_PUBLIC_TEACH_URL ?? 'https://teach.acadimic.com',
  /** This app's own address, which a shared link's preview needs to name its page and image. */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.acadimic.com',
  /** Prints on every legal page as the date the current text took effect. */
  policiesEffectiveFrom: '2026-09-26',
} as const;

/** The tag the course generator stamps on a course it drafted; mirrors `packages/shared/src/ai/course-generator.ts`. */
export const AI_GENERATED_COURSE_TAG = 'ai_generated';
