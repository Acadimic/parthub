/** The guided-tour step copy, keyed by the screen each tour runs on. */
export const TOUR_ITEMS = 'tourItems';

export const TOUR_TYPES = {
  ADD_QUESTION: 'add-question',
  HOME: 'home',
  TEACHER_HOME: 'teacher-home',
  ADD_MEETING: 'add-meeting',
  ADD_CONTENT: 'add-content',
};

export const TOUR_CONFIGS = {
  [TOUR_TYPES.ADD_QUESTION]: [
    {
      selector: '[data-tour="question-type"]',
      content:
        "Tell us, what type of Question you want to add.  We have all types in our buffet, from single choice, multiple-choice, one word to text. Hope it's all you want.",
    },
    {
      selector: '[data-tour="function"]',
      content:
        "Once you will we adding questions, you will need this PartHub function assistant to add difficult equations, mathematical notations, or just a free flow diagram. It's meant to make the most difficult part super easy... And don't forget to add your favourites.",
    },
    {
      selector: '[data-tour="question"]',
      content: 'Here goes the question content.',
    },
    {
      selector: '[data-tour="added-question"]',
      content: 'We will keep all your work safe here.',
    },
    {
      selector: '[data-tour="publish"]',
      content:
        'Sit back and relax you are done, Just let us know whenever you want to let your students take the test.',
    },
    {
      selector: '[data-tour="paper-link"]',
      content: 'In case you wanna share the test with anybody.',
    },
    {
      selector: '[data-tour="create-pdf"]',
      content: 'If you want to create a pdf once you are done just let us know.',
    },
  ],
  [TOUR_TYPES.HOME]: [
    {
      selector: '[data-tour="schedule"]',
      content: 'Schedule a meeting or a class within a minute. It can be repetitive or one-time.',
    },
    {
      selector: '[data-tour="today-class"]',
      content:
        "Once scheduled, we will keep you posted about all your classes today. Don't miss to check it out after you schedule your first class.",
    },
    {
      selector: '[data-tour="create-paper"]',
      content:
        'Create any kind of quizzes, assignments, or tests for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="create-content"]',
      content:
        'Add any kind of study materials for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="workspace"]',
      content:
        "Your latest working materials would appear here. Let's continuously improve papers and study materials content for your students.",
    },
    {
      selector: '[data-tour="teacher-invite"]',
      content: "Invite a teacher for handling multiple batches. We'll create the dashboard for your teachers.",
    },
    {
      selector: '[data-tour="student-invite"]',
      content:
        'Invite a student you are teaching to any of your current batches. If no batch exits, do not worry we will create one for you.',
    },
    {
      selector: '[data-tour="my-batches"]',
      content: 'Pheewwww, here are all your batches.... Invite the Parths to explore',
    },
    {
      selector: '[data-tour="drawer"]',
      content: "Let's explore more functionalities by clicking here.",
    },
  ],
  [TOUR_TYPES.TEACHER_HOME]: [
    {
      selector: '[data-tour="schedule"]',
      content: 'Schedule a meeting or a class within a minute. It can be repetitive or one-time.',
    },
    {
      selector: '[data-tour="today-class"]',
      content:
        "Once scheduled, we will keep you posted about all your classes today. Don't miss to check it out after you schedule your first class.",
    },
    {
      selector: '[data-tour="create-paper"]',
      content:
        'Create any kind of quizzes, assignments, or tests for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="create-content"]',
      content:
        'Add any kind of study materials for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="workspace"]',
      content:
        "Your latest working materials would appear here. Let's continuously improve papers and study materials content for your students.",
    },
    {
      selector: '[data-tour="student-invite"]',
      content:
        'Invite a student you are teaching to any of your current batches. If no batch exits, do not worry we will create one for you.',
    },
    {
      selector: '[data-tour="my-batches"]',
      content: 'Pheewwww, here are all your batches.... Invite the Parths to explore',
    },
    {
      selector: '[data-tour="drawer"]',
      content: "Let's explore more functionalities by clicking here.",
    },
  ],
  [TOUR_TYPES.ADD_MEETING]: [
    {
      selector: '[data-tour=""]',
      content: '',
    },
    {
      selector: '[data-tour=""]',
      content: '',
    },
    {
      selector: '[data-tour=""]',
      content: '',
    },
    {
      selector: '[data-tour=""]',
      content: '',
    },
  ],
  [TOUR_TYPES.ADD_CONTENT]: [
    {
      selector: '[data-tour="content-type"]',
      content: 'You may want to add a syllabus, notes, or some references for your students for the subject. ',
    },
    {
      selector: '[data-tour="function"]',
      content:
        'From complex mathematical equations, scientific expressions to free flow diagrams, our intuitive functions will help. Even if you wish to add some images, we got you covered..... Do not forget to add favourites.',
    },
    {
      selector: '[data-tour="upload"]',
      content: 'Click here to upload pdf files for your students.',
    },
    {
      selector: '[data-tour="document-link"]',
      content: 'If you have any external links, let us know here.',
    },
    {
      selector: '[data-tour="video-link"]',
      content: 'We will also store videos for your content repository.',
    },
  ],
};
