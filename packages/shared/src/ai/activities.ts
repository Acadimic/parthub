import { ACTIVITY_FENCE_NAMES, ACTIVITY_FENCES, richTextFromMarkdown } from '../utils';
import type { IAiIssue } from './common';

const OPEN = new RegExp(`^:::\\s*(${ACTIVITY_FENCE_NAMES.join('|')})\\b`);
const CLOSE = /^:::\s*$/;

/** What a fence of each kind must hold, said the way an author would fix it. */
const NEEDS: Record<string, string> = {
  check: 'a question, then at least two "- [x]" / "- [ ]" options, at least one of them [x]',
  reveal: 'a question, a line of "---", then the answer',
  soundboard: 'a pipe table',
  cards: 'one "- front :: back" line per card',
  say: 'at least one line to say',
  steps: 'two or more steps separated by lines of "---"',
  soundmap: 'a pipe table whose rows start with throat, palate, roof, teeth or lips',
  sentence:
    'one "- role word :: meaning" line per tile (roles: doer, action, object, place, time, with, for, from, whose), sentences separated by "---"',
  picture: 'src= on the fence line and one "- x,y word :: meaning" line per point',
};

/**
 * Interactive blocks (`::: check`, `::: reveal`, `::: soundboard`, `::: cards`, `::: say`). A fence
 * that does not parse would reach the learner as its raw lines, so it is an error, not a warning.
 */
export const checkActivities = (markdown: string, path: string, issues: IAiIssue[]) => {
  const lines = (markdown ?? '').split('\n');
  lines.forEach((raw, index) => {
    const open = OPEN.exec(raw.trim());
    if (!open) return;
    const kind = open[1] as keyof typeof ACTIVITY_FENCES;
    let close = index + 1;
    while (close < lines.length && !CLOSE.test(lines[close].trim())) close += 1;
    if (close >= lines.length) {
      issues.push({ level: 'error', path, message: `A "::: ${kind}" block is never closed with ":::".` });
      return;
    }
    const node = richTextFromMarkdown(lines.slice(index, close + 1).join('\n')).doc.content[0];
    if (node?.type !== ACTIVITY_FENCES[kind]) {
      issues.push({ level: 'error', path, message: `A "::: ${kind}" block (line ${index + 1}) needs ${NEEDS[kind]}.` });
      return;
    }
    if (kind === 'check' && !(node.content ?? []).some((child) => child.attrs?.correct === true)) {
      issues.push({
        level: 'error',
        path,
        message: `A "::: check" block (line ${index + 1}) has no right option marked [x].`,
      });
    }
  });
};
