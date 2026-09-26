import { COMPANY } from '@utils/constants';
import Link from 'next/link';
import { type ILegalSection } from './LegalDocument';

const Email = ({ address }: { address: string }) => <a href={`mailto:${address}`}>{address}</a>;

export const PRIVACY_SECTIONS: ILegalSection[] = [
  {
    id: 'scope',
    title: 'What this policy covers',
    body: (
      <>
        <p>
          This policy explains what personal data {COMPANY.legalName} (“{COMPANY.name}”, “we”) collects when you use the
          learning app and the teaching app, why we collect it, who sees it and what you can do about it. It is written
          for learners, parents, teachers and organisations alike.
        </p>
        <p>
          We are the data fiduciary for account and platform data. When a teacher or organisation enrols you in their
          course, they see your progress in that course and are responsible for how they use it. This policy does not
          cover the sites and services we link to, such as a video host or a payment provider, which have their own
          policies.
        </p>
      </>
    ),
  },
  {
    id: 'collect',
    title: 'What we collect',
    body: (
      <>
        <p>
          <strong>Account.</strong> Your name, email address and profile photo, and, if you sign in with Google or
          Microsoft, the name, email and photo that provider shares with us. A password is held by Firebase
          Authentication, never by us in readable form. Teachers and organisations also give an organisation name and a
          role.
        </p>
        <p>
          <strong>Learning.</strong> The courses you enrol in, which lessons you have completed, every answer you give
          in a practice or a test, the marks awarded, how long you spent on each question and on the paper, what you
          marked for review, and your bookmarks, likes and follows. This is what makes your activity page and your
          teacher’s view of your progress.
        </p>
        <p>
          <strong>Live sessions.</strong> Whether you joined a session, and a recording if the publisher records it.
        </p>
        <p>
          <strong>Payments.</strong> Which plan you bought, when, and for how much. Card and bank details go straight to
          Razorpay and never reach our servers; we receive a payment reference and its status.
        </p>
        <p>
          <strong>Uploads.</strong> A profile photo and, for teachers, the files that make up their courses. These are
          stored in Amazon S3 in a folder belonging to your organisation.
        </p>
        <p>
          <strong>Technical.</strong> Your IP address, browser and device type, timezone, the pages you request, and
          error logs. Our servers log requests with the authorisation header removed.
        </p>
        <p>
          We do not run advertising, and we do not use analytics trackers on the learning app. We do not collect
          location, contacts, precise device identifiers or anything from other apps.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use it',
    body: (
      <>
        <ul>
          <li>to create and secure your account, and to sign you in;</li>
          <li>to deliver the courses you enrol in, mark your papers and show your progress to you and your teacher;</li>
          <li>to process payments and send receipts, renewals and refunds;</li>
          <li>to answer support requests and complaints, including copyright notices;</li>
          <li>to keep the Service working: debugging, security, preventing abuse and measuring load;</li>
          <li>to tell you about changes to the Service or to these policies;</li>
          <li>to meet legal obligations, such as tax records and lawful requests from authorities.</li>
        </ul>
        <p>
          We send product news only if you opt in, and every such email has an unsubscribe link. We never sell personal
          data.
        </p>
      </>
    ),
  },
  {
    id: 'basis',
    title: 'Our legal basis',
    body: (
      <>
        <p>
          In India we process personal data under the Digital Personal Data Protection Act, 2023, with your consent for
          the purposes above, or for the legitimate uses the Act allows, such as performing a contract you asked for,
          complying with the law and responding to an emergency. You can withdraw consent at any time as described under
          Your rights; withdrawing it stops the processing it covered but does not undo processing done before.
        </p>
        <p>
          If you are in the European Economic Area or the United Kingdom, our bases under the GDPR are: performance of
          our contract with you (accounts, courses, payments), our legitimate interests (security, support, improving
          the Service) balanced against your rights, consent where we ask for it, and legal obligation.
        </p>
      </>
    ),
  },
  {
    id: 'ai',
    title: 'AI and your data',
    body: (
      <>
        <p>
          Teachers can prepare courses with the help of an outside AI model. The prompts our teaching app writes contain
          the syllabus, the course structure and the teacher’s own saved lessons and questions. They do not contain
          learners’ names, answers, results or any other personal data, and a teacher cannot add it from the app.
        </p>
        <p>
          We do not use your answers, results, activity, uploads or account data to train any AI model, and we do not
          share them with model providers for that or any other purpose. Marking is done by our own servers against the
          teacher’s answer key, not by a model.
        </p>
        <p>
          Lessons made with AI assistance may cite outside references. We check that those links are reachable when the
          lesson is generated; following one takes you to that site under its own policy.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who sees your data',
    body: (
      <>
        <p>
          <strong>Your teacher and their organisation</strong> see your name, photo, progress, answers and marks in the
          courses you are enrolled in with them, so they can teach you. They do not see your activity in other
          publishers’ courses.
        </p>
        <p>
          <strong>Other learners</strong> see your name and photo if you like or follow something publicly. They never
          see your answers or marks.
        </p>
        <p>
          <strong>Service providers</strong> who work for us under contract and only on our instructions: Google
          Firebase (sign-in), Amazon Web Services (file storage and hosting), Razorpay (payments) and the video platform
          a publisher chooses for live sessions. Each is bound to protect the data and to use it only to provide their
          service to us.
        </p>
        <p>
          <strong>Authorities</strong>, when the law requires it or to protect someone’s safety, and{' '}
          <strong>a successor</strong> if {COMPANY.name} is sold or merged, in which case this policy continues to apply
          to your data.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children and parents',
    body: (
      <>
        <p>
          Many of our learners are under 18. For them, a parent or legal guardian must create or approve the account and
          gives the consents in this policy on their behalf. We verify that consent in the ways the law recognises,
          which may include a small payment from the parent’s own payment instrument or an identity check.
        </p>
        <p>
          We do not show advertising to children, do not track them across other sites or apps, and do not build
          behavioural profiles of them. Progress and marks are shown only to the child, their parent or guardian, and
          the teacher of the course, so that the course can be taught.
        </p>
        <p>
          A parent or guardian can see, correct or delete their child’s data, or close the account, by writing to{' '}
          <Email address={COMPANY.privacyEmail} /> from the email address on the account.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: (
      <>
        <p>
          We keep your sign-in, your theme and a few interface preferences in your browser so the app works. We set no
          advertising or analytics cookies. Embedded videos and the payment page may set their own. The full list and
          how to control it are in the <Link href="/cookies">Cookie Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <>
        <ul>
          <li>
            Account and learning data: for as long as your account is open, so your progress is there when you return.
          </li>
          <li>After you close your account: deleted or anonymised within 30 days, except as below.</li>
          <li>Payment records: 8 years, as tax law requires, holding only what the law needs.</li>
          <li>Support and complaint correspondence: 2 years after the matter closes.</li>
          <li>Server logs: 90 days.</li>
          <li>
            Backups: overwritten on a rolling 35-day cycle; data removed from live systems leaves backups on that cycle.
          </li>
        </ul>
        <p>
          Content you published as a teacher stays available to learners who paid for it for the period they paid for,
          with your name on it, unless you ask us to remove it.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    body: (
      <>
        <p>
          Data travels over HTTPS and is stored encrypted at rest. Sign-in is handled by Firebase Authentication, with
          password hashing and support for Google and Microsoft accounts. Every request to our API carries a signed
          token and is checked against your organisation and role, so one organisation cannot read another’s data.
          Uploads are written to a folder that belongs to your organisation and read through short-lived signed links.
          Access by our staff is limited to what a task needs and is logged.
        </p>
        <p>
          If a breach affects your data we will tell you and the Data Protection Board of India without undue delay, as
          the law requires, and say what happened and what we are doing about it.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>You can, at any time:</p>
        <ul>
          <li>see the personal data we hold about you and get a copy;</li>
          <li>correct anything that is wrong or out of date, much of it directly in account settings;</li>
          <li>delete your data or close your account;</li>
          <li>withdraw a consent you gave, without affecting what was done under it before;</li>
          <li>nominate someone to exercise these rights for you if you are unable to;</li>
          <li>
            complain to our grievance officer, and if you are not satisfied, to the Data Protection Board of India.
          </li>
        </ul>
        <p>
          In the EEA and UK you also have the rights to restrict or object to processing, to data portability, and to
          complain to your local supervisory authority.
        </p>
        <p>
          Write to <Email address={COMPANY.privacyEmail} /> from the email address on your account. We answer within 30
          days and do not charge for a first request.
        </p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Where your data is stored',
    body: (
      <>
        <p>
          Our servers and storage are hosted with Amazon Web Services, and sign-in with Google Firebase. Some of these
          providers process data outside your country. Where they do, we rely on their contractual commitments and, for
          EEA and UK data, on standard contractual clauses, so that your data gets the same protection wherever it is.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <>
        <p>
          We will update this policy when the Service or the law changes. For a change that affects your rights or how
          we use your data we will tell you by email or in the app before it takes effect. The date at the top of the
          page is when the current text took effect.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact and grievance officer',
    body: (
      <>
        <p>
          Privacy questions and requests: <Email address={COMPANY.privacyEmail} />. Grievance officer under the Digital
          Personal Data Protection Act, 2023 and the Information Technology Rules, 2021:{' '}
          {COMPANY.grievanceOfficer.name || 'to be appointed'}, <Email address={COMPANY.grievanceOfficer.email} />.
          {COMPANY.postalAddress ? ` Postal address: ${COMPANY.postalAddress}.` : ''}
        </p>
      </>
    ),
  },
];
