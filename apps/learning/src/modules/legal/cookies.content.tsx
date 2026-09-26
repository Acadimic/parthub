import { COMPANY } from '@utils/constants';
import Link from 'next/link';
import { type ILegalSection } from './LegalDocument';

interface IStorageItem {
  name: string;
  setBy: string;
  purpose: string;
  lasts: string;
}

/** Everything the learning app puts in your browser. Kept in step with `StorageKey` in the shared enums. */
const STORAGE: IStorageItem[] = [
  {
    name: 'token',
    setBy: COMPANY.name,
    purpose: 'Your sign-in token, so you stay signed in between visits.',
    lasts: 'Until you sign out',
  },
  {
    name: 'firebase:authUser',
    setBy: 'Google Firebase',
    purpose: 'The signed-in session Firebase Authentication keeps for us.',
    lasts: 'Until you sign out',
  },
  { name: 'theme', setBy: COMPANY.name, purpose: 'Light or dark, as you chose it.', lasts: 'Until you change it' },
  {
    name: 'collapsed',
    setBy: COMPANY.name,
    purpose: 'Whether you collapsed the side panel.',
    lasts: 'Until you change it',
  },
  {
    name: 'standard, subject, organization',
    setBy: COMPANY.name,
    purpose: 'The standard, subject and organisation you last chose, so the catalogue opens where you left it.',
    lasts: 'Until you change them',
  },
  {
    name: 'presigned-urls',
    setBy: COMPANY.name,
    purpose: 'Short-lived links to images already fetched, so they are not fetched again.',
    lasts: 'Minutes',
  },
];

const StorageTable = () => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full text-sm">
      <thead className="bg-muted text-left text-xs uppercase tracking-caps text-muted-foreground">
        <tr>
          <th className="px-3 py-2 font-semibold">Name</th>
          <th className="px-3 py-2 font-semibold">Set by</th>
          <th className="px-3 py-2 font-semibold">Purpose</th>
          <th className="px-3 py-2 font-semibold">Lasts</th>
        </tr>
      </thead>
      <tbody>
        {STORAGE.map((item) => (
          <tr key={item.name} className="border-t border-border align-top">
            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{item.name}</td>
            <td className="whitespace-nowrap px-3 py-2">{item.setBy}</td>
            <td className="px-3 py-2">{item.purpose}</td>
            <td className="whitespace-nowrap px-3 py-2">{item.lasts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const COOKIES_SECTIONS: ILegalSection[] = [
  {
    id: 'what',
    title: 'What cookies and local storage are',
    body: (
      <>
        <p>
          A cookie is a small file a website stores in your browser. Local storage is a similar space in your browser
          that a site can write to. Both let a site remember something between one page and the next: that you are
          signed in, or that you prefer dark mode. This policy lists what {COMPANY.name} stores in your browser and why.
        </p>
      </>
    ),
  },
  {
    id: 'ours',
    title: 'What we store',
    body: (
      <>
        <p>
          Everything we store is needed for the app to work or to remember a choice you made. We set no advertising
          cookies and no analytics or tracking cookies, and we do not fingerprint your device.
        </p>
        <StorageTable />
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Set by others',
    body: (
      <>
        <p>
          <strong>Video embeds.</strong> When a lesson plays a YouTube video, YouTube sets its own cookies from the
          moment the player loads, under Google’s privacy policy.
        </p>
        <p>
          <strong>Payments.</strong> When you pay, Razorpay’s checkout runs in your browser and sets the cookies it
          needs to complete and secure the payment, under Razorpay’s privacy policy.
        </p>
        <p>
          <strong>Sign-in with Google or Microsoft.</strong> Choosing one of these opens that provider’s sign-in page,
          which sets its own cookies.
        </p>
      </>
    ),
  },
  {
    id: 'control',
    title: 'How to control them',
    body: (
      <>
        <p>
          Signing out removes your sign-in token and session. Your browser lets you view and delete what any site has
          stored, and block cookies from a site, through its privacy or site-data settings. If you clear the items
          above, the app still works: you will be signed out and your theme and last choices will reset.
        </p>
        <p>
          Blocking third-party cookies in your browser may stop embedded videos from playing or a payment from
          completing on that site; you can open the video or the payment on the provider’s own site instead.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes and contact',
    body: (
      <>
        <p>
          If we add a cookie or a storage item we will add it here first. Questions go to{' '}
          <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>. How we handle personal data generally
          is in the <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
];
