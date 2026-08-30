import { QuestionType } from '@enums';
import { IGeneratedMaterialPrompt, IGeneratedQuestionsPrompt } from '@interfaces';
import { splitCamelCase } from '@utils/helpers';

const typesText = `

interface TextNode {
  type: 'text';
  content: string;
}

interface CodeNode {
  type: 'code';
  content: string;
  language: string;
}

interface HeadingNode {
  type: 'heading';
  content: TextNode[];
  level: number; // 2, 3, 4, 5
}

interface ListNode {
  type: 'list';
  content: TextNode[]; // heading of the list means the title of the list if any
  items: TextNode[][]; // each list item can have multiple TextNodes
  isOrdered: boolean;
}

interface LinkNode {
  type: 'link';
  content: TextNode[];
  href: string;
  isInline: boolean;
}

interface ImageNode {
  type: 'image';
  data?: string; // Base64 data
  url?: string; // Source URL
}

type Block =
  | TextNode
  | CodeNode
  | HeadingNode
  | ListNode
  | LinkNode
  | ImageNode

  You can use the above types to generate the Block objects.
`;

export const getGeneratedQuestionsPrompt = ({
  numberOfQuestions,
  questionType,
  standardNames,
  subjectNames,
  levels,
  prompt,
}: IGeneratedQuestionsPrompt): string => {
  return `Generate ${numberOfQuestions} ${splitCamelCase(questionType)} questions along with 
  ${[QuestionType.MULTIPLE_CHOICE, QuestionType.SINGLE_CHOICE].includes(questionType) ? '4' : questionType === QuestionType.BOOLEAN ? '2' : '1'} 
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

  If math expressions are present in questions and options and solution, use $$<MathJax>$$ format wherever applicable.

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
  return `Generate detailed study material ${chapterName ? `of chapter ${chapterName}` : ''} for ${topic} of Grade ${standardName} – ${subjectName}. ${prompt}. The output must strictly follow the Block schema and should be clear and understandable for students.

  The output must strictly follow the following schema of Block objects:

  ${typesText}
  

  Rules for Output:

  1. The output must be a valid JSON array of Block objects only.

  2. Use HeadingNode for main topics and subtopics (level 2-5).

  3. Use TextNode for detailed explanations, definitions, step-by-step derivations, and real-life examples. The material must be clear, well-structured, and easy for a student to understand.

  4. Use ListNode for key points, rules, or step-by-step solutions (ordered/unordered).

  5. Use CodeNode for programming examples or structured formulas.

  6. Use ImageNode where diagrams, graphs, or illustrations would improve understanding.

  7. Use LinkNode for references to external trusted resources.

  8. All math expressions must be wrapped in $$<MathJax>$$. Example: { "type": "text", "content": "The area of a circle is $$A = \\pi r^2$$." }

  9. Ensure that each concept is explained in detail:
    a. Start with basic definitions.

    b. Add step-by-step explanations.

    c. Include examples and applications.

    d. Where possible, explain common mistakes and how to avoid them.

    e. Use images and diagrams to improve understanding.

    f. Make sure the material is comprehensive and covers all the important concepts of the ${chapterName ? `chapter ${chapterName} of` : ''} ${topic} for the Grade ${standardName} – ${subjectName}.
  
  10. At the end of the material, add a References section with LinkNode objects pointing to reliable textbooks, research papers, or trusted websites.

  11. The material should be structured in a way that can be directly exported to a PDF (clear headings, sections, references).

  12. Provide output as a JSON array of Block objects and create a PDF file from the output.

  13. Additionally, provide a separate JSON array of famous YouTube videos related to the topic in the format:

    interface YouTubeVideo {
      title: string;
      url: string;
    }
  
  Note:
  1. If these a large write all in a JSON file using the above format.
  2. Use html attribute to add formatting to text wherever applicable. example: for line break use <br />, for bold use <b>...</b>, for italic use <i>...</i> and so on....
  3. Ensure images, links and videos urls are valid and should be available for public.
  4. Ensure the JSON is properly formatted and valid.
  5. Must Apply: If math expressions are present in the text please use $$<MathJax>$$ format wherever applicable.

  ${prompt ? `Additional usage instructions: ${prompt}` : ''}
    `;
};
