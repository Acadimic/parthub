export interface ITestimonial {
  id: string;
  name: string;
  /** Who they are in one line: the class or exam, or the role for a parent or teacher. */
  role: string;
  /** What they used, as a short tag on the card. */
  context: string;
  /** A portrait under `public/images/testimonials`, served as a static path. */
  avatar: string;
  quote: string;
  /** 1–5. */
  rating: number;
}

/**
 * Placeholder voices, written to the platform's real features (day-wise modules, practice against
 * timed tests, marked papers, live sessions, the activity page) until reviews are collected from
 * learners. The portraits are stock faces (UI Faces via randomuser.me), fine for a mock-up and to be
 * replaced by real learners' photos, with their consent, along with the quotes. The summary line
 * above the wall is derived from these, so it changes with them.
 */
export const TESTIMONIALS: ITestimonial[] = [
  {
    id: 't1',
    name: 'Priya Nair',
    role: 'JEE aspirant, Kota',
    avatar: '/images/testimonials/priya-nair.jpg',
    context: 'Mathematics',
    quote:
      'Practice mode with the answer right there during the week, then a timed paper on Sunday. My scores went from around 40% to 70% in two months, and I could watch it happen on the activity page.',
    rating: 5,
  },
  {
    id: 't2',
    name: 'Liam Carter',
    role: 'A-levels, Manchester',
    avatar: '/images/testimonials/liam-carter.jpg',
    context: 'Physics',
    quote:
      'I used to skip past the derivations. The day-by-day plan made me sit with one topic at a time, and the weekly check-ins showed exactly which chapters I was guessing on before my mocks.',
    rating: 5,
  },
  {
    id: 't3',
    name: 'Daniel Kowalski',
    role: 'Grade 10, Chicago',
    avatar: '/images/testimonials/daniel-kowalski.jpg',
    context: 'Mathematics',
    quote:
      'The marked papers tell me why I lost marks, not just that I did. Negative marking finally made sense to me.',
    rating: 4,
  },
  {
    id: 't4',
    name: 'Mei Tanaka',
    role: 'University entrance prep, Osaka',
    avatar: '/images/testimonials/mei-tanaka.jpg',
    context: 'Biology',
    quote:
      'Live sessions sit inside the course plan, so I never miss one. Bookmarking every question I got wrong and redoing them the week before the exam was the best habit I picked up here.',
    rating: 5,
  },
  {
    id: 't5',
    name: 'Vikram Rao',
    role: 'Parent, Class 8, Bengaluru',
    avatar: '/images/testimonials/vikram-rao.jpg',
    context: 'Science',
    quote:
      'I can see what my son actually did this week, not just that he “studied”. The streak on his activity page keeps him honest, and it keeps me out of his hair.',
    rating: 5,
  },
  {
    id: 't6',
    name: 'Amara Okafor',
    role: 'B.Sc. Physics, year 1, Lagos',
    avatar: '/images/testimonials/amara-okafor.jpg',
    context: 'Astrophysics',
    quote:
      'The astrophysics course goes deeper than my lecture notes, and the equations render properly on my phone. That sounds small until you have tried reading them anywhere else.',
    rating: 4,
  },
  {
    id: 't7',
    name: 'Anil Deshmukh',
    role: 'Teacher on Acadimic, Pune',
    avatar: '/images/testimonials/anil-deshmukh.jpg',
    context: 'Chemistry',
    quote:
      'I plan a course by day and the platform marks every paper for me. My evenings go to the students who need help, not to checking answer sheets.',
    rating: 5,
  },
  {
    id: 't8',
    name: 'Hana Park',
    role: 'Olympiad, Grade 9, Seoul',
    avatar: '/images/testimonials/hana-park.jpg',
    context: 'Mathematics',
    quote:
      'Timed tests with review flags feel like the real thing. By the day of the actual olympiad I had sat twelve of them here, and the nerves were gone.',
    rating: 5,
  },
  {
    id: 't9',
    name: 'Miguel Santos',
    role: 'Grade 11, Manila',
    avatar: '/images/testimonials/miguel-santos.jpg',
    context: 'Chemistry',
    quote:
      'I resume exactly where I stopped, even on the jeepney. Fifteen minutes a day on the readings added up to the whole organic chemistry unit before school even reached it.',
    rating: 4,
  },
];
