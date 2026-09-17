import { QuestionType } from '@enums';
import { type IGeneratedMaterialPrompt, type IGeneratedQuestionsPrompt } from '@interfaces';
import { splitCamelCase } from '@utils/helpers';

/**
 * The Markdown the editor understands, stated for the model.
 *
 * Deliberately a short list rather than "use Markdown": the importer accepts exactly what the
 * editor can store, so anything outside this set would be flattened to a paragraph on the first
 * save. Naming the subset is what keeps generated material editable rather than merely readable.
 */
const markdownRules = `
  Use Markdown, restricted to these constructs:

  - Headings with #, ## or ### only (never deeper).
  - Paragraphs separated by a blank line.
  - Bullet lists with "- ", ordered lists with "1. ".
  - Blockquotes with "> ".
  - Fenced code blocks with triple backticks.
  - Horizontal rules with ---.
  - Inline emphasis: **bold**, _italic_, ~~strike~~, \`code\`.
  - Inline maths as $...$ and display maths on its own line as $$...$$, both in LaTeX.

  Do not use HTML tags, tables, images or footnotes — the editor cannot store them.
  A literal dollar sign in prose must be escaped as \$ so it is not read as maths.
`;

export const getGeneratedQuestionsPrompt = ({
  numberOfQuestions,
  questionType,
  standardNames,
  subjectNames,
  levels,
  prompt,
}: IGeneratedQuestionsPrompt): string => {
  let optionCount = '1';
  if ([QuestionType.MULTIPLE_CHOICE, QuestionType.SINGLE_CHOICE].includes(questionType)) optionCount = '4';
  else if (questionType === QuestionType.BOOLEAN) optionCount = '2';

  return `Generate ${numberOfQuestions} ${splitCamelCase(questionType)} questions along with 
  ${optionCount} 
  options & solution (if applicable) per question in the following structured JSON format:

  interface Question {
    "questionText": "<string>",
    "options": [
      {
        "optionText": "<string>",
        "isCorrect": <boolean>
      },
      {
        "optionText": "<string>",
        "isCorrect": <boolean>
      },
      {
        "optionText": "<string>",
        "isCorrect": <boolean>
      },
      {
        "optionText": "<string>",
        "isCorrect": <boolean>
      }
    ],
    "standard": "<Grade>",
    "subject": "<Subject>",
    "level": "<Level>",
    "solutionText": "<string>"
  }

  Select random standards (grades) from this list: ${JSON.stringify(standardNames)}

  Select random subjects from this list: ${JSON.stringify(subjectNames)}

  Select the Question level from this list: ${JSON.stringify(levels)}

  Ensure that at least one option is marked with "isCorrect": true and others are false or omitted.

  Question, option and solution text is Markdown. Inline maths is $...$ and display maths is $$...$$, both in LaTeX. Escape a literal dollar sign as \\$.

  Provide output as a JSON array of Question objects.

  Example of standards: ${JSON.stringify(standardNames)}
  Example of subjects: ${JSON.stringify(subjectNames)}

  Make sure the questions are unique, clear, educational, and relevant to the chosen standard and subject. Write all these questions in a JSON file using the above format.
  ${prompt ? `Additional usage instructions: ${prompt}` : ''}`;
};

export const getGeneratedMaterialPrompt = ({
  topic,
  standardName,
  subjectName,
  prompt,
  chapterName,
}: IGeneratedMaterialPrompt): string => {
  return `Generate detailed study material ${chapterName ? `of chapter ${chapterName}` : ''} for ${topic} of Grade ${standardName} – ${subjectName}. ${prompt}. It should be clear and understandable for students.

  ${markdownRules}

  Structure and depth:

  1. Open each concept with a plain definition, then build up step by step.
  2. Include worked examples and real-life applications.
  3. Call out common mistakes and how to avoid them.
  4. Cover every important concept of ${chapterName ? `chapter ${chapterName} of ` : ''}${topic} for Grade ${standardName} – ${subjectName}.
  5. Use headings for topics and subtopics, and lists for rules, key points and step-by-step solutions.
  6. End with a References section listing reliable textbooks, papers or trusted sites as plain links.

  Output:

  Return the study material as Markdown text only — no JSON wrapper, no code fence around the whole
  answer, no commentary before or after it.

  Then, separately, return a JSON array of famous YouTube videos related to the topic:

    interface YouTubeVideo {
      title: string;
      url: string;
    }

  Ensure every video URL is valid and publicly available.

  ${prompt ? `Additional usage instructions: ${prompt}` : ''}
    `;
};
