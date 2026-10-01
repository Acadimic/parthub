import { type IResultCount } from '@stores';
import { Marking } from '@enums';

/** One question of the sitting, as the result page reads it. */
export interface IQuestionOutcome {
  id: string;
  /** 1-based, in paper order. */
  number: number;
  sectionId: string;
  sectionName: string;
  subjectName: string;
  chapterName: string;
  levelName: string;
  marking: Marking;
  /** The marks this question earned, negative when it cost marks. */
  marks: number;
  /** The marks a correct answer was worth. */
  maxMarks: number;
  /** Seconds spent on the question. */
  timeSpent: number;
}

/** How the questions can be grouped on the breakdown chart. */
export type Grouping = 'section' | 'subject' | 'chapter' | 'level';

export const GROUPING_LABELS: Record<Grouping, string> = {
  section: 'Section',
  subject: 'Subject',
  chapter: 'Chapter',
  level: 'Difficulty',
};

/** One row of a breakdown: the questions sharing a section, subject, chapter or level. */
export interface IOutcomeGroup {
  name: string;
  total: number;
  counts: IResultCount;
  marks: number;
  maxMarks: number;
  timeSpent: number;
  /** Correct over answered, 0–100; 0 when nothing in the group was answered. */
  accuracy: number;
}

export interface IVerdict {
  text: string;
  tone: 'success' | 'warning' | 'destructive';
}

/** The marks a sitting earned, lost to negative marking, and never went for. */
export interface IMarksSplit {
  earned: number;
  lost: number;
  skipped: number;
}

export const emptyCounts = (): IResultCount => ({
  [Marking.CORRECT]: 0,
  [Marking.PARTIALLY_CORRECT]: 0,
  [Marking.INCORRECT]: 0,
  [Marking.UNATTEMPTED]: 0,
});

const round = (value: number) => Math.round(value * 10) / 10;

export const getAccuracy = (counts: IResultCount): number => {
  const answered = counts[Marking.CORRECT] + counts[Marking.INCORRECT];
  return answered ? Math.round((counts[Marking.CORRECT] / answered) * 100) : 0;
};

export const getVerdict = (percent: number): IVerdict => {
  if (percent >= 80) return { text: 'Excellent', tone: 'success' };
  if (percent >= 60) return { text: 'Very good', tone: 'success' };
  if (percent >= 40) return { text: 'Good effort', tone: 'warning' };
  if (percent >= 20) return { text: 'Keep practising', tone: 'warning' };
  return { text: 'A tough one', tone: 'destructive' };
};

const getGroupName = (question: IQuestionOutcome, grouping: Grouping): string => {
  if (grouping === 'section') return question.sectionName;
  if (grouping === 'subject') return question.subjectName;
  if (grouping === 'chapter') return question.chapterName;
  return question.levelName;
};

/** The questions grouped one way, in order of first appearance so the chart follows the paper. */
export const groupOutcomes = (questions: IQuestionOutcome[], grouping: Grouping): IOutcomeGroup[] => {
  const groups = new Map<string, IOutcomeGroup>();
  questions.forEach((question) => {
    const name = getGroupName(question, grouping);
    const group = groups.get(name) ?? {
      name,
      total: 0,
      counts: emptyCounts(),
      marks: 0,
      maxMarks: 0,
      timeSpent: 0,
      accuracy: 0,
    };
    group.total += 1;
    group.counts[question.marking] += 1;
    group.marks = round(group.marks + question.marks);
    group.maxMarks += question.maxMarks;
    group.timeSpent += question.timeSpent;
    groups.set(name, group);
  });
  return [...groups.values()].map((group) => ({ ...group, accuracy: getAccuracy(group.counts) }));
};

export const splitMarks = (questions: IQuestionOutcome[]): IMarksSplit =>
  questions.reduce<IMarksSplit>(
    (split, question) => {
      if (question.marking === Marking.UNATTEMPTED) split.skipped = round(split.skipped + question.maxMarks);
      else if (question.marks < 0) split.lost = round(split.lost + question.marks);
      else split.earned = round(split.earned + question.marks);
      return split;
    },
    { earned: 0, lost: 0, skipped: 0 },
  );

export const countOutcomes = (questions: IQuestionOutcome[]): IResultCount =>
  questions.reduce<IResultCount>((counts, question) => {
    counts[question.marking] += 1;
    return counts;
  }, emptyCounts());

/** Seconds per outcome, so the time chart can say where the minutes went. */
export const timeByMarking = (questions: IQuestionOutcome[]): IResultCount =>
  questions.reduce<IResultCount>((totals, question) => {
    totals[question.marking] += question.timeSpent;
    return totals;
  }, emptyCounts());

/** `45s`, `2m 05s`, `1h 02m`: compact enough for an axis tick or a tile. */
export const formatSeconds = (seconds: number): string => {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes) return `${minutes}m ${String(secs).padStart(2, '0')}s`;
  return `${secs}s`;
};

export const formatMarks = (marks: number): string => {
  if (marks > 0) return `+${marks}`;
  return String(marks);
};

/**
 * Three or four short observations a learner can act on, in the order they matter: where marks
 * went, then where time went. Empty for a sitting with nothing answered.
 */
export const getInsights = (questions: IQuestionOutcome[], subjects: IOutcomeGroup[]): string[] => {
  const insights: string[] = [];
  const answered = questions.filter((question) => question.marking !== Marking.UNATTEMPTED);
  if (!answered.length) return insights;

  const rated = subjects.filter((group) => group.counts[Marking.CORRECT] + group.counts[Marking.INCORRECT] > 0);
  if (rated.length >= 2) {
    const sorted = [...rated].sort((a, b) => b.accuracy - a.accuracy);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.accuracy !== worst.accuracy) {
      insights.push(`Strongest in ${best.name} at ${best.accuracy}% accuracy; ${worst.name} is at ${worst.accuracy}%.`);
    }
  }

  const { lost, skipped } = splitMarks(questions);
  if (lost < 0) insights.push(`Incorrect answers cost ${Math.abs(lost)} marks through negative marking.`);
  const unattempted = questions.length - answered.length;
  if (unattempted) {
    insights.push(
      `${unattempted} ${unattempted === 1 ? 'question' : 'questions'} left unanswered, worth ${skipped} marks.`,
    );
  }

  const totalTime = questions.reduce((sum, question) => sum + question.timeSpent, 0);
  const slowest = [...questions].sort((a, b) => b.timeSpent - a.timeSpent)[0];
  const average = answered.reduce((sum, question) => sum + question.timeSpent, 0) / answered.length;
  if (slowest && average && slowest.timeSpent >= average * 2) {
    const multiple = Math.round(slowest.timeSpent / average);
    insights.push(
      `Question ${slowest.number} took ${formatSeconds(slowest.timeSpent)}, about ${multiple}× your average.`,
    );
  }
  const wrongTime = timeByMarking(questions)[Marking.INCORRECT];
  if (totalTime && wrongTime / totalTime >= 0.3) {
    insights.push(`${Math.round((wrongTime / totalTime) * 100)}% of the time went to questions answered incorrectly.`);
  }

  return insights.slice(0, 4);
};
