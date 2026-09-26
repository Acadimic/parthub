import { Accordion } from '@repo/ui/core';
import { SectionHeading } from '@components/app/sections';

const QUESTIONS = [
  {
    title: 'Is it free to start?',
    body: 'Yes. Create an account, open any published course and start its first module. Some courses may carry a price set by the teacher; that is shown on the course before you begin.',
  },
  {
    title: 'What is the difference between practice and a test?',
    body: 'Practice shows you the answer and solution as soon as you respond to each question, with no clock. A test runs against the paper’s time limit, lets you mark questions for review, and is marked in full when you submit. Only tests count towards your scores.',
  },
  {
    title: 'How are test papers marked?',
    body: 'On the server, the moment you submit. Choice questions are checked against the answer key, numeric and written answers are compared to the accepted answers, and each question’s marks follow the scheme the teacher set, including negative marking where it applies.',
  },
  {
    title: 'Which classes and exams are covered?',
    body: 'Courses are catalogued by standard: school classes, competitive exams, olympiads, undergraduate and postgraduate programmes. Use the Explore menu or the catalogue filters to see what is published for yours.',
  },
  {
    title: 'Can I use it on my phone?',
    body: 'Yes. Every page, including test papers, works on phones and tablets, in light or dark mode.',
  },
];

/** The questions people ask before they sign up. */
export const Faq = () => (
  <section className="flex flex-col gap-8 py-12 md:py-16">
    <SectionHeading
      eyebrow="FAQ"
      title="Questions, answered"
      subtitle="The things learners ask before their first course."
      action={null}
    />
    <div className="rounded-xl border border-border bg-background px-2">
      <Accordion
        type="single"
        items={QUESTIONS.map((question) => ({
          title: question.title,
          component: <p className="text-sm leading-relaxed text-muted-foreground">{question.body}</p>,
        }))}
      />
    </div>
  </section>
);
