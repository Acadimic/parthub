import { type TestPaperResultDto } from '@repo/shared/contracts';
import { Marking, QuestionType } from '../enums';
import { type IExam } from './exam.types';
import { useQuestionStore } from './question.store';

/** Question types answered by typing, compared as text rather than by option id. */
const TYPED_QUESTION_TYPES = new Set<QuestionType>([
  QuestionType.INTEGER,
  QuestionType.FILL_IN_THE_BLANK,
  QuestionType.SUBJECTIVE,
]);

const normalise = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * How one question's responses mark against its correct options. A typed answer matches a correct
 * option's text; a choice is correct when it names exactly the correct options, partially correct
 * when it names some and nothing wrong.
 */
export const markResponse = (questionId: string, responses: string[], answers: string[]): Marking => {
  if (!responses.length || !responses[0]?.trim()) return Marking.UNATTEMPTED;
  const question = useQuestionStore.getState().getQuestionById(questionId);
  if (question?.questionType && TYPED_QUESTION_TYPES.has(question.questionType)) {
    const given = normalise(responses[0]);
    const isMatch = useQuestionStore
      .getState()
      .getCorrectOptions(questionId)
      .some((option) => normalise(option.body.text ?? '') === given);
    return isMatch ? Marking.CORRECT : Marking.INCORRECT;
  }
  if (answers.some((answer) => !responses.includes(answer)) || responses.length > answers.length) {
    return Marking.INCORRECT;
  }
  return answers.length === responses.length ? Marking.CORRECT : Marking.PARTIALLY_CORRECT;
};

/** The sitting as the API takes it. The marking goes too; the server recomputes and replaces it. */
export const toResultPayload = (exam: IExam, marksObtained: number): TestPaperResultDto => ({
  _id: exam._id,
  testPaper: exam.testPaper,
  course: exam.course,
  title: exam.title,
  isPractice: exam.isPractice,
  responseMaps: exam.responseMaps,
  questionWiseSpendTime: exam.questionWiseSpendTime,
  questionWiseReplyTime: exam.questionWiseReplyTime,
  totalSpendTime: exam.totalSpendTime,
  visited: exam.visited,
  markedForReviews: exam.markedForReviews,
  sections: exam.sections,
  questions: exam.questions,
  sectionWiseQuestionIdsMaps: exam.sectionWiseQuestionIdsMaps,
  standards: exam.standards,
  subjects: exam.subjects,
  numberOfQuestions: exam.numberOfQuestions,
  durationMins: exam.durationMins,
  maxMarks: exam.maxMarks,
  paperCategory: exam.paperCategory,
  paperType: exam.paperType,
  year: exam.year,
  resultMaps: exam.resultMaps,
  answerMaps: exam.answerMaps,
  marksObtained,
});
