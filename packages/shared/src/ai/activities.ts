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
  concept: 'the explanation (any text, tables or lists); give it a title="…" on the fence line',
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

/** The blocks that let a learner act; a concept counts as practised once one of these follows it. */
const PLAYABLE = new Set([
  'check',
  'reveal',
  'steps',
  'soundboard',
  'soundmap',
  'picture',
  'sentence',
  'say',
  'listening',
]);
const KEY_POINTS = /title="?key points/i;

/**
 * The learn-then-play shape (`apps/teaching/src/utils/ai/LESSON_DESIGN.md` §1): concepts before
 * their practice, never more than two in a row, a closing "Key points" concept and a set of cards.
 * Warnings only: a lesson that misses the shape still imports.
 */
export const checkLessonShape = (markdown: string, path: string, issues: IAiIssue[]) => {
  const warn = (message: string) => issues.push({ level: 'warning', path, message });
  const fences = (markdown ?? '')
    .split('\n')
    .map((line) => /^:::\s*([a-z]+)\b(.*)$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => !!match)
    .map((match) => ({ kind: match[1], attrs: match[2] }));
  const isKeyPoints = (fence: { kind: string; attrs: string }) =>
    fence.kind === 'concept' && KEY_POINTS.test(fence.attrs);
  const concepts = fences.filter((fence) => fence.kind === 'concept' && !isKeyPoints(fence));
  if (concepts.length < 2) {
    warn(`Only ${concepts.length} "::: concept" block(s); teach each idea in a concept before its practice.`);
  }
  if (!fences.some(isKeyPoints)) {
    warn('No closing ::: concept title="Key points" listing the key items of every concept.');
  }
  if (!fences.some((fence) => fence.kind === 'cards')) warn("No ::: cards block with the lesson's new terms.");
  let run = 0;
  for (const fence of fences) {
    if (fence.kind === 'concept' && !isKeyPoints(fence)) run += 1;
    else if (PLAYABLE.has(fence.kind)) run = 0;
    if (run > 2) {
      warn('More than two concepts in a row: put practice between them.');
      break;
    }
  }
};

/** How to write the interactive blocks, for a prompt (the syntax `checkActivities` accepts). */
export const ACTIVITY_RULES = `
Interactive blocks are fenced with ":::" on their own lines. Every question carries its answer inside its block.

\`\`\`
::: concept title="The idea, only if the heading does not already name it"
80–150 words: what it is, when it is used, how it is formed (a small pipe table may help), two to four examples, and one "**Watch out:**" common mistake. No questions inside, and no other ::: block.
:::

::: check
The question.
- [ ] a wrong option that is a real misconception
- [x] the right option (any number may be [x])
---
Why the right option is right, in one or two lines.
:::

::: reveal
An open question: explain, calculate, translate.
---
The answer, with the working.
:::

::: steps
The first form or line, with the part that changes in **bold**
What this step does, in one line
---
The next form or line
What changed
:::

::: picture src=figure:F1 alt="what the picture shows" mode=find
- 24,40 word or label :: meaning
- 70,55 another label :: meaning
:::

::: cards
- term :: one-line meaning
- another term :: its meaning
:::
\`\`\`

- "steps" builds a result one change at a time (a derivation, a worked example, a form). "picture" labels points on a figure by x,y percent; mode=find makes the learner tap them, so its figure must have no words on it.
- Language courses also have "::: soundboard" (a pipe table of words to tap and hear), "::: say" (lines to say aloud, one per paragraph) and "::: sentence" (one "- role word :: meaning" line per tile, roles doer, action, object, place, time, with, for, from, whose; sentences separated by "---").
`;
