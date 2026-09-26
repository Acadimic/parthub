export interface IHelpEntry {
  question: string;
  answer: string;
}

export interface IHelpTopic {
  id: string;
  title: string;
  description: string;
  entries: IHelpEntry[];
}

/** The help centre's questions, grouped by where in the product they come up. */
export const HELP_TOPICS: IHelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Accounts, signing in and finding a course.',
    entries: [
      {
        question: 'How do I create an account?',
        answer:
          'Choose Sign Up, then either enter an email and password or continue with Google or Microsoft. If you are under 18, a parent or guardian should create the account or approve it, since they give the consents on your behalf.',
      },
      {
        question: 'How do I find courses for my class or exam?',
        answer:
          'Open Explore in the header (or the compass button on a phone) and pick your standard, or go to Courses and use the chips at the top. Every course is catalogued under the standard it prepares you for, and you can narrow further by subject with the Filter button.',
      },
      {
        question: 'What is the difference between a course preview and the modules page?',
        answer:
          'The preview shows what a course covers, who teaches it and what it costs, before you start. The modules page is where you learn: the day-by-day plan, each lesson and test, and your progress through them.',
      },
      {
        question: 'I forgot my password.',
        answer:
          'On the sign-in page choose Forgot Password and enter your email. You will get a link to set a new one. If you signed up with Google or Microsoft there is no password to reset; sign in with that provider again.',
      },
    ],
  },
  {
    id: 'courses',
    title: 'Courses and lessons',
    description: 'Working through a course, marking lessons done, resuming.',
    entries: [
      {
        question: 'How is a course organised?',
        answer:
          'A course is a plan of days grouped into weeks. Each day holds one or more items: a reading, a video, a test paper or a live session. The outline on the left of the modules page lists them in order, and the day you are on is highlighted.',
      },
      {
        question: 'How do I mark a lesson as complete?',
        answer:
          'Read or watch it, then use the swipe-to-complete control at the bottom of the lesson. Completed items get a tick in the outline and count towards the course progress on your cards and activity page.',
      },
      {
        question: 'Where do I pick up where I left off?',
        answer:
          'Opening a course from the catalogue or from Continue learning on the home page takes you to the first item you have not completed. The Previous and Next buttons at the bottom move you through the plan.',
      },
      {
        question: 'Can I bookmark or like a lesson?',
        answer:
          'Yes. Every lesson and question has a bookmark, and every course can be liked and its teacher followed. Bookmarks are private to you; likes and follows show your name to the teacher.',
      },
      {
        question: 'The equations in a lesson look wrong.',
        answer:
          'Maths is rendered with KaTeX and should look right on every device. If a formula is garbled, it is a mistake in the lesson itself: report it from the lesson and we will pass it to the teacher.',
      },
    ],
  },
  {
    id: 'tests',
    title: 'Practice and tests',
    description: 'The two ways to sit a paper, marking, and results.',
    entries: [
      {
        question: 'What is the difference between Practice and Attempt?',
        answer:
          'Practice has no clock. Answer a question and you see immediately whether you were right, with the solution. Attempt is a timed test: the clock starts when you press Start, you can mark questions for review and clear answers, and the whole paper is marked when you submit or time runs out. Only attempts count towards your scores.',
      },
      {
        question: 'How are papers marked?',
        answer:
          'On our servers, the moment you submit. Single and multiple choice questions are checked against the answer key; numeric and written answers are compared with the accepted answers the teacher set. Each question awards the marks in its marking scheme, including negative marks for a wrong answer where the paper uses them.',
      },
      {
        question: 'What do the colours on the question palette mean?',
        answer:
          'Green is answered, red is visited but not answered, amber is marked for review (with a dot if it is also answered), and grey is not visited yet. After marking, the palette shows correct, incorrect, partially correct and unattempted instead.',
      },
      {
        question: 'Can I retake a test?',
        answer:
          'Yes, as many times as you like. Every attempt is saved separately, and the course shows your latest score and how many attempts you have made. Your activity page lists them all.',
      },
      {
        question: 'I lost my connection during a test.',
        answer:
          'Your answers are kept in the app as you go. Reconnect and continue; the clock keeps running against the paper’s time limit. If the paper timed out while you were offline, it is submitted with the answers you had given.',
      },
    ],
  },
  {
    id: 'sessions',
    title: 'Live sessions',
    description: 'Joining scheduled classes and recordings.',
    entries: [
      {
        question: 'Where do I see my sessions?',
        answer:
          'Sessions in the header lists every live session from the courses you are enrolled in, with the time in your timezone. A session also appears on its day in the course plan.',
      },
      {
        question: 'How do I join one?',
        answer:
          'Open the session when it is due and choose Join. It opens on the video platform the teacher uses. Join a few minutes early the first time so you can check your microphone and camera there.',
      },
      {
        question: 'I missed a session.',
        answer:
          'If the teacher recorded it, the recording appears in the course in place of the session. Not every teacher records, so ask them if you cannot find one.',
      },
    ],
  },
  {
    id: 'activity',
    title: 'Activity and progress',
    description: 'What the activity page shows and how it is worked out.',
    entries: [
      {
        question: 'What counts as activity?',
        answer:
          'Completing a lesson or a test, and submitting a test attempt. Practice sittings are not saved, so they do not appear. The overview tiles, the twelve-week grid and the timeline are all built from those events.',
      },
      {
        question: 'How is a streak counted?',
        answer:
          'A streak is consecutive days with at least one activity. Your current streak survives until the end of the day after your last activity, so an evening off does not break it until the next midnight.',
      },
      {
        question: 'Why does my course show 8% when I have done three lessons?',
        answer:
          'Progress is completed items divided by everything in the course: readings, videos and tests. A large course with many items moves slowly at first; the modules page shows the same figure as the number of items done.',
      },
      {
        question: 'Who can see my activity?',
        answer:
          'You, your parent or guardian if they hold the account, and the teacher of each course for that course only. Nobody else.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account and billing',
    description: 'Profile, payments, refunds, closing an account.',
    entries: [
      {
        question: 'How do I change my name, photo or password?',
        answer:
          'Open Account from the header or the tab bar. Profile holds your name and photo; Security holds your password and the sign-in providers connected to your account.',
      },
      {
        question: 'How do I pay for a course?',
        answer:
          'Paid courses show their plan on the preview page. Choose it and you are taken to Razorpay’s checkout, where you can pay by card, UPI, net banking or wallet. Your card details never pass through our servers.',
      },
      {
        question: 'Can I get a refund?',
        answer:
          'If you bought a course by mistake or it is not as described, write to support within 7 days of purchase and before you have completed more than a small part of it. The full policy is in the Terms of Service under Plans, payments and refunds.',
      },
      {
        question: 'How do I cancel a subscription?',
        answer:
          'From Account, under the course’s plan, choose Cancel renewal. You keep access until the end of the period you have paid for and are not charged again.',
      },
      {
        question: 'How do I delete my account and data?',
        answer:
          'Write to the privacy address on the Contact page from the email on your account. We close the account and delete or anonymise your data within 30 days, except records the law makes us keep, such as payment records.',
      },
    ],
  },
  {
    id: 'teachers',
    title: 'For teachers',
    description: 'Publishing, AI assistance and your students.',
    entries: [
      {
        question: 'How do I publish a course?',
        answer:
          'Courses are built in the teaching app at teach.acadimic.com. Plan the days, add readings, videos and test papers, schedule any live sessions, set a plan if the course is paid, then publish. It appears in the catalogue under its standards and subjects.',
      },
      {
        question: 'How does AI assistance work?',
        answer:
          'The teaching app writes a prompt for you from your standards, subjects, pace and saved materials. You run it in a model of your choice and paste the result back; the app checks it and builds the course from it. Lessons and quizzes are generated the same way, and every link a lesson cites is checked for reachability. You review everything before it is published, and the course is shown as prepared with AI assistance.',
      },
      {
        question: 'What am I responsible for in an AI-assisted course?',
        answer:
          'The same things as in one you wrote by hand: that it is accurate, that it matches the syllabus you claim, and that you have the right to use everything in it, including anything a model drafted that resembles someone else’s work and any reference it cites. The Terms of Service set this out under AI-assisted courses.',
      },
      {
        question: 'What do I see about my students?',
        answer:
          'For each course you publish: who is enrolled, which items they have completed, and every test attempt with its answers, marks and timings. You do not see their activity in other teachers’ courses.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Privacy and safety',
    description: 'Data, children, reporting problems.',
    entries: [
      {
        question: 'Is my data used to train AI?',
        answer:
          'No. Your answers, results, activity and account data are never used to train any model, ours or a provider’s. The prompts teachers run contain course material, not learner data.',
      },
      {
        question: 'How do you handle children’s accounts?',
        answer:
          'A parent or guardian creates or approves the account and gives the consents. We show no advertising to children, do not track them elsewhere, and show their progress only to them, their parent and their teacher. The Privacy Policy has the details.',
      },
      {
        question: 'How do I report wrong content or a copyright problem?',
        answer:
          'For a mistake in a lesson or question, use the report control on it or write to support. For material you believe infringes your rights, send the details listed in the Terms of Service under Copyright and other complaints to the copyright address, and we act within 36 hours.',
      },
    ],
  },
];
