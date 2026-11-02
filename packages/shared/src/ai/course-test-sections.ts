import { LevelType } from '../enums';
import { type IAiTestSpec } from '../interfaces';
import { type IAiIssue } from './common';

/** A test planned in sections: each part named and counted, at a real level, adding up to the whole. */
export const checkTestSections = (spec: IAiTestSpec, path: string): IAiIssue[] => {
  const sections = spec.sections ?? [];
  const issues: IAiIssue[] = [];
  if (!Array.isArray(sections) || !sections.length) {
    return [{ level: 'error', path, message: 'Leave "sections" out, or list at least one.' }];
  }
  sections.forEach((section, index) => {
    const at = `${path}[${index}]`;
    if (!section?.name?.trim()) issues.push({ level: 'error', path: at, message: 'A section needs a name.' });
    if (typeof section?.questionCount !== 'number' || section.questionCount <= 0) {
      issues.push({ level: 'error', path: at, message: 'A section needs a positive questionCount.' });
    }
    if (section?.level && !Object.values(LevelType).includes(section.level)) {
      issues.push({
        level: 'error',
        path: `${at}.level`,
        message: `"level" must be one of ${Object.values(LevelType).join(', ')}.`,
      });
    }
  });
  const total = sections.reduce((sum, section) => sum + (section?.questionCount ?? 0), 0);
  if (total !== spec.questionCount) {
    issues.push({
      level: 'error',
      path,
      message: `The sections add up to ${total} questions, but questionCount is ${spec.questionCount}.`,
    });
  }
  return issues;
};
