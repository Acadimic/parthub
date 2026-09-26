import { COMPANY } from '@utils/constants';
import Link from 'next/link';
import { type ILegalSection } from './LegalDocument';

const Email = ({ address }: { address: string }) => <a href={`mailto:${address}`}>{address}</a>;

export const TERMS_SECTIONS: ILegalSection[] = [
  {
    id: 'agreement',
    title: 'The agreement',
    body: (
      <>
        <p>
          These terms are a contract between you and {COMPANY.legalName} (“{COMPANY.name}”, “we”, “us”). They cover the
          learning app, the teaching app at {COMPANY.teachUrl}, and everything published through them: courses, lessons,
          test papers, live sessions and the activity records that come from using them (together, the “Service”).
        </p>
        <p>
          By creating an account or using the Service you accept these terms and our{' '}
          <Link href="/privacy">Privacy Policy</Link>. If you use the Service on behalf of a school, coaching centre or
          other organisation, you confirm you have the authority to bind it, and “you” includes that organisation.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Who may use the Service',
    body: (
      <>
        <p>
          The Service is for learners of every age, and many learners are under 18. If you are under 18, a parent or
          legal guardian must create or approve your account and accept these terms for you. We treat the parent or
          guardian as the account holder for the purposes of consent, payments and communication about the account, as
          the Digital Personal Data Protection Act, 2023 requires in India.
        </p>
        <p>
          Teachers and organisations must be who they say they are. We may ask for proof of identity or of the
          organisation before a course can be published or paid for.
        </p>
        <p>
          You are responsible for keeping your sign-in details private and for everything done through your account.
        </p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'What the Service is',
    body: (
      <>
        <p>
          Teachers and organisations build courses in the teaching app. A course is planned day by day and holds
          readings, videos, test papers and scheduled live sessions. Learners enrol in the learning app, work through
          the plan, practise, sit marked tests and follow their progress on their activity page.
        </p>
        <p>
          {COMPANY.name} provides the platform. The teaching itself, and the content of each course, comes from the
          teacher or organisation that publishes it. Where a course names a syllabus, board or exam, that is the
          publisher’s statement of what the course covers, not a claim by us of any affiliation with or endorsement by
          that body.
        </p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Plans, payments and refunds',
    body: (
      <>
        <p>
          Some courses are free. Others carry a plan set by the publisher: a one-time price or a recurring subscription,
          in the currency shown at checkout. Payments are processed by Razorpay; we do not see or store your card or
          bank details. Prices include applicable taxes unless the checkout says otherwise.
        </p>
        <p>
          A subscription renews at the end of each period until you cancel it from your account, and cancelling stops
          the next renewal without refunding the current one. Access to a course lasts for the period you paid for and,
          for a one-time purchase, for as long as the course stays published.
        </p>
        <p>
          If you bought a course by mistake or it does not work as described, write to{' '}
          <Email address={COMPANY.supportEmail} /> within 7 days of purchase and before you have completed more than a
          small part of it, and we will refund you. Refunds for a problem with the course content are decided with the
          publisher. Refunds go back to the payment method you used.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Content and licences',
    body: (
      <>
        <p>
          <strong>Publisher content.</strong> A teacher or organisation keeps ownership of the courses, lessons,
          questions and recordings they publish. By publishing, they grant us a worldwide, non-exclusive licence to
          host, copy, format, transmit and display that content to deliver the Service, to mark and analyse test papers,
          and to show extracts in the catalogue and in search. They confirm they own the content or have the rights
          needed to publish it, that it is accurate to the best of their knowledge, and that it does not infringe
          anyone’s rights or break any law.
        </p>
        <p>
          <strong>Learner content.</strong> Your answers, notes, bookmarks, likes and profile photo remain yours. You
          grant us a licence to store and process them to run the Service: to mark your papers, show your progress to
          you and to your teacher, and keep your account working.
        </p>
        <p>
          <strong>Our content.</strong> The platform itself, its design, code, trade marks and the wording of pages like
          this one belong to {COMPANY.name}. You may not copy the Service or use our name or marks without written
          permission.
        </p>
        <p>
          You may download materials a course offers for download, for your own study. You may not share test papers,
          recordings or paid materials outside the Service, scrape the catalogue, or resell access.
        </p>
      </>
    ),
  },
  {
    id: 'ai',
    title: 'AI-assisted courses',
    body: (
      <>
        <p>
          The teaching app can draft a course outline, lessons, questions, solutions and a cover image with the help of
          an artificial intelligence model. The teacher chooses the model, runs the prompt we prepare, and imports what
          comes back. Courses made this way are marked in our records, and we show that a course was prepared with AI
          assistance on its page.
        </p>
        <p>
          <strong>Human review.</strong> AI drafts are drafts. The teacher who publishes an AI-assisted course is
          responsible for reviewing and correcting it before publication and for keeping it right afterwards, exactly as
          for a course written by hand. A model can state a fact, a formula or an answer key wrongly with complete
          confidence, and it can be out of date with a syllabus.
        </p>
        <p>
          <strong>What we do not promise.</strong> We do not warrant that any course, AI-assisted or not, is complete,
          current or error-free, or that it matches a particular board, exam or syllabus. Check anything you will rely
          on in an examination against the official source. If you find a mistake, report it from the lesson or the
          question, or write to <Email address={COMPANY.supportEmail} />, and we will pass it to the publisher.
        </p>
        <p>
          <strong>Third-party material in AI output.</strong> A model may produce text or images that resemble or
          reproduce someone else’s work, and lessons may cite outside references such as videos, articles and PDFs. The
          publisher must have the right to use everything in their course, whether they wrote it, a model drafted it, or
          it came from a reference. We check that cited links are reachable when a lesson is generated; we do not check
          who owns them. Cited references remain the property of their owners and are covered by the next section.
        </p>
        <p>
          <strong>Model providers.</strong> When a teacher runs a prompt in an outside model, that provider’s own terms
          and privacy policy apply to what the teacher sends it. Our prompts carry the course’s syllabus, structure and
          the teacher’s own saved materials; they do not carry learners’ personal data or answers.
        </p>
        <p>
          <strong>Your data and models.</strong> We do not use learners’ answers, results, activity or personal data to
          train any AI model, our own or anyone else’s, and we do not allow model providers to do so.
        </p>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party content and links',
    body: (
      <>
        <p>
          Lessons may embed or link to material hosted elsewhere: videos on YouTube, articles, textbooks and PDFs from
          publishers, boards and other sites. That material belongs to its owners, is provided under their terms, and
          may change or disappear without notice. A link is not an endorsement, and we are not responsible for what is
          on the other side of it.
        </p>
        <p>
          Playing an embedded video or following a link takes you to that provider, which may set its own cookies and
          collect its own data, as described in our <Link href="/cookies">Cookie Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'copyright',
    title: 'Copyright and other complaints',
    body: (
      <>
        <p>
          We respect intellectual property and expect publishers to do the same. If you believe content on the Service
          infringes your copyright or other rights, send a notice to <Email address={COMPANY.copyrightEmail} /> with:
          the work you own and proof of ownership or authority; the exact location on the Service of the material you
          complain of; a statement, made in good faith, that the use is not authorised; your name, address and contact
          details; and your signature. We act on complete notices within 36 hours, as the Information Technology
          (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 require, and we honour valid notices under
          the US Digital Millennium Copyright Act.
        </p>
        <p>
          We tell the publisher what was removed and why. A publisher who believes the removal was a mistake may send a
          counter-notice with the same details and a statement of their right to use the material; we may then restore
          the content unless the complainant starts legal proceedings. Accounts that infringe repeatedly are closed.
        </p>
        <p>
          Complaints about other unlawful, abusive or misleading content go to our grievance officer, named in the last
          section, who acknowledges within 24 hours and resolves within 15 days.
        </p>
      </>
    ),
  },
  {
    id: 'conduct',
    title: 'Acceptable use and academic integrity',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>share your account, or sit a test on someone else’s account or let someone sit one on yours;</li>
          <li>
            copy, distribute or publish test papers, answer keys, solutions or session recordings outside the Service;
          </li>
          <li>
            upload content that is unlawful, harassing, hateful, sexual, misleading or infringing, or that contains
            malware;
          </li>
          <li>collect other users’ personal data, or contact learners for purposes outside their course;</li>
          <li>
            interfere with the Service, probe its security, or access it by any means other than the interfaces we
            provide;
          </li>
          <li>misrepresent a course’s affiliation with a school, board, exam body or institution.</li>
        </ul>
        <p>
          Tests here are for your own learning. Marks, streaks and activity records are shown to you and, for a course
          you are enrolled in, to its teacher. They are not an official certificate or transcript.
        </p>
      </>
    ),
  },
  {
    id: 'sessions',
    title: 'Live sessions and recordings',
    body: (
      <>
        <p>
          Live sessions are scheduled by the publisher and may be held on a video platform of their choice. A session
          may be recorded for learners who missed it; you will be told when a session is being recorded. Recordings are
          part of the course and covered by the same licence and restrictions as its other content. Behave in a session
          as you would in a classroom; a publisher may remove anyone who disrupts one.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Suspension and closing an account',
    body: (
      <>
        <p>
          You can close your account at any time from your account settings or by writing to{' '}
          <Email address={COMPANY.supportEmail} />. We may suspend or close an account that breaks these terms, after
          telling you why and, unless the breach is serious or the law requires otherwise, giving you a chance to
          respond. A publisher may unpublish a course; learners keep access to what they paid for as described under
          Plans, payments and refunds. What happens to your data when an account closes is set out in the{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers and liability',
    body: (
      <>
        <p>
          The Service is provided “as is”. We do our best to keep it available, accurate and secure, but we do not
          promise it will be uninterrupted or error-free, that a course will get you a particular grade or result, or
          that any content is fit for a particular purpose. Nothing in these terms limits liability that cannot be
          limited by law.
        </p>
        <p>
          To the extent the law allows, our total liability to you for any claim connected with the Service is limited
          to the amount you paid us in the 12 months before the claim arose, or ₹5,000 if you paid nothing. We are not
          liable for indirect or consequential loss, for loss of data you have not backed up, or for the acts of
          publishers, model providers or third-party sites.
        </p>
        <p>
          Publishers indemnify us against claims arising from the content they publish, including AI-assisted content
          they did not review and third-party material they had no right to use.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to the Service and these terms',
    body: (
      <>
        <p>
          We improve the Service continually and may add, change or withdraw features. We may also update these terms.
          For a material change we will tell you by email or in the app at least 14 days before it takes effect, and
          continuing to use the Service after that date means you accept the new terms. The date at the top of this page
          is when the current text took effect.
        </p>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    body: (
      <>
        <p>
          These terms are governed by the laws of {COMPANY.country}. If a dispute cannot be settled by talking to us,
          the courts of {COMPANY.country} have exclusive jurisdiction, without prejudice to any right you have as a
          consumer to bring a claim where you live. If any part of these terms is found unenforceable, the rest stays in
          force.
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
          General questions: <Email address={COMPANY.supportEmail} />. Legal notices:{' '}
          <Email address={COMPANY.legalEmail} />. Copyright complaints: <Email address={COMPANY.copyrightEmail} />.
        </p>
        <p>
          Grievance officer under the Information Technology Rules, 2021 and the Digital Personal Data Protection Act,
          2023: {COMPANY.grievanceOfficer.name || 'to be appointed'}, <Email address={COMPANY.grievanceOfficer.email} />
          .{COMPANY.postalAddress ? ` Postal address: ${COMPANY.postalAddress}.` : ''}
        </p>
      </>
    ),
  },
];
