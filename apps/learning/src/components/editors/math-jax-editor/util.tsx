import { RenderEquation } from '@components/others';
import {
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  CodeIcon,
  FunctionIcon,
  ImageIcon,
  LinkIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextHOneIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from '@phosphor-icons/react';
import { type Block, EditorContentType, type EquationBlock, EquationType } from './types';

export const serializeEquationBlocks = (blocks: EquationBlock[], delimiter = ' '): string => {
  return blocks.map((block) => serializeEquation(block)).join(delimiter);
};

export const serializeRowBlocks = (rows: EquationBlock[][][], delimiter = '\\\\'): string => {
  return `${rows.map((row) => row.map((blocks) => serializeEquationBlocks(blocks, ' ')).join(' & ')).join(delimiter)} ${delimiter}`;
};

// bmatrix → square brackets [ ]
// pmatrix → parentheses ( )
// vmatrix → single vertical bars | |
// Vmatrix → double vertical bars ‖ ‖

export function serializeEquation(equation: EquationBlock): string {
  switch (equation.type) {
    case EquationType.TEXT:
      return equation.content;
    case EquationType.FRACTION:
      return `\\frac{${serializeEquationBlocks(equation.numerator)}}{${serializeEquationBlocks(equation.denominator)}}`;
    case EquationType.MATRIX:
      return `\\begin{bmatrix} ${serializeRowBlocks(equation.rows)} \\end{bmatrix}`;
    case EquationType.DETERMINANT:
      return `\\begin{vmatrix} ${serializeRowBlocks(equation.rows)} \\end{vmatrix}`;
    case EquationType.TABLE:
      return `\\begin{array}{${equation.isBordered ? '|' : ''}${equation.rows.map(() => 'c').join(equation.isBordered ? '|' : '')} ${equation.isBordered ? '|' : ''}} ${equation.isBordered ? '\\hline ' : ''} ${serializeRowBlocks(equation.rows, equation.isBordered ? '\\\\ \\hline ' : undefined)} \\end{array}`;
    case EquationType.SUPERSCRIPT:
      return `${serializeEquationBlocks(equation.content)}^{${serializeEquationBlocks(equation.exponent)}}`;
    case EquationType.SUBSCRIPT:
      return `${serializeEquationBlocks(equation.content)}_{${serializeEquationBlocks(equation.base)}}`;
    case EquationType.ROOT:
      return `\\sqrt[${equation.index}]{${serializeEquationBlocks(equation.content)}}`;
    case EquationType.SYMBOL:
      return `${equation.content}`;
    case EquationType.LIMIT:
      return `\\lim_{${serializeEquationBlocks(equation.left)} \\to ${serializeEquationBlocks(equation.right)}} ${serializeEquationBlocks(equation.content)}`;
    case EquationType.INTEGRAL:
      return `\\int_{${serializeEquationBlocks(equation.bottom)}}^{${serializeEquationBlocks(equation.top)}} ${serializeEquationBlocks(equation.content)}`;
    default:
      return '';
  }
}

export function serializeBlocks(blocks: Block[], isEditing = false): React.ReactNode {
  return blocks.map((block) => serializeBlock(block, isEditing));
}

export function serializeBlock(block: Block, isEditing = false): React.ReactNode {
  switch (block.type) {
    case EditorContentType.TEXT:
      return !block.content && !isEditing ? (
        <></>
      ) : (
        <span
          className={`pr-1.5 my-1 leading-4 ${block.className ? block.className : ''} ${block.bold ? '!font-bold' : ''} ${block.italic ? '!italic' : ''} ${block.underline ? '!underline' : ''}`}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    case EditorContentType.CODE:
      return (
        <div className="font-mono mr-1.5">
          <pre>
            <code>{block.content}</code>
          </pre>
        </div>
      );
    case EditorContentType.HEADING:
      const levelMap: Record<number, number> = {
        2: 2.5,
        3: 2.25,
        4: 2,
        5: 1.75,
      };
      return (
        <div style={{ fontSize: `calc(0.5rem * ${levelMap[block.level]})` }} className={`font-bold my-1.5`}>
          {serializeBlocks(block.content, isEditing)}
          <br />
        </div>
      );
    case EditorContentType.LIST:
      return (
        <div className={isEditing ? 'px-1' : ''}>
          {serializeBlocks(block.content, isEditing)}
          <ul className="list-disc m-0">
            {block.items.map((blocks, index) => (
              <li key={index}>{serializeBlocks(blocks, isEditing)}</li>
            ))}
          </ul>
        </div>
      );
    case EditorContentType.ORDERED_LIST:
      return (
        <div className={isEditing ? 'px-1' : ''}>
          {serializeBlocks(block.content, isEditing)}
          <ol className="list-decimal m-0">
            {block.items.map((blocks, index) => (
              <li key={index}>{serializeBlocks(blocks, isEditing)}</li>
            ))}
          </ol>
        </div>
      );
    case EditorContentType.EQUATION:
      return (
        <div className="inline-table mr-1.5">
          <RenderEquation equation={serializeEquationBlocks(block.blocks)} />
        </div>
      );
    case EditorContentType.CONTENT:
      return <div className="inline-table">{serializeBlocks(block.content, isEditing)}</div>;
    case EditorContentType.LINK:
      const linkItem = (
        <a className="text-blue-primary font-medium" href={block.href} target="_blank">
          {serializeBlocks(block.content, isEditing)}
        </a>
      );
      return block.isInline ? <span className="py-1">{linkItem}</span> : <div className="my-1.5">{linkItem}</div>;
    case EditorContentType.IMAGE:
      return (
        <div className="flex justify-center items-center">
          <img className="max-w-[340px]" src={block.data || block.url} alt="image" />
        </div>
      );
    default:
      return '';
  }
}

export const getEquationInitialContent = (type: EquationType): EquationBlock => {
  switch (type) {
    case EquationType.TEXT:
      return {
        type: EquationType.TEXT,
        content: '',
      };
    case EquationType.FRACTION:
      return {
        type: EquationType.FRACTION,
        numerator: [{ type: EquationType.TEXT, content: '' }],
        denominator: [{ type: EquationType.TEXT, content: '' }],
      };
    case EquationType.SYMBOL:
      return {
        type: EquationType.SYMBOL,
        name: '',
        content: '',
      };
    case EquationType.SUPERSCRIPT:
      return {
        type: EquationType.SUPERSCRIPT,
        content: [{ type: EquationType.TEXT, content: '' }],
        exponent: [{ type: EquationType.TEXT, content: '' }],
      };
    case EquationType.SUBSCRIPT:
      return {
        type: EquationType.SUBSCRIPT,
        content: [{ type: EquationType.TEXT, content: '' }],
        base: [{ type: EquationType.TEXT, content: '' }],
      };
    case EquationType.ROOT:
      return {
        type: EquationType.ROOT,
        content: [{ type: EquationType.TEXT, content: '' }],
        index: '',
      };
    case EquationType.CUBE_ROOT:
      return {
        type: EquationType.ROOT,
        content: [{ type: EquationType.TEXT, content: '' }],
        index: '3',
      };
    case EquationType.MATRIX:
      return {
        type: EquationType.MATRIX,
        rows: [],
      };
    case EquationType.DETERMINANT:
      return {
        type: EquationType.DETERMINANT,
        rows: [],
      };
    case EquationType.TABLE:
      return {
        type: EquationType.TABLE,
        rows: [],
        isBordered: true,
      };
    case EquationType.LIMIT:
      return {
        type: EquationType.LIMIT,
        content: [{ type: EquationType.TEXT, content: '' }],
        left: [{ type: EquationType.TEXT, content: 'x' }],
        right: [{ type: EquationType.TEXT, content: '0' }],
      };
    case EquationType.INTEGRAL:
      return {
        type: EquationType.INTEGRAL,
        content: [{ type: EquationType.TEXT, content: '' }],
        top: [{ type: EquationType.TEXT, content: 'x' }],
        bottom: [{ type: EquationType.TEXT, content: '0' }],
      };
    default:
      return {
        type: EquationType.TEXT,
        content: '',
      };
  }
};

export const EditorContentIconMap: Record<EditorContentType, React.ReactNode> = {
  [EditorContentType.UNDO]: <ArrowUUpLeftIcon className="w-5 h-5" />,
  [EditorContentType.REDO]: <ArrowUUpRightIcon className="w-5 h-5" />,
  [EditorContentType.TEXT]: <TextHOneIcon className="w-5 h-5" />,
  [EditorContentType.CONTENT]: <TextHOneIcon className="w-5 h-5" />,
  [EditorContentType.BOLD]: <TextBIcon className="w-5 h-5" />,
  [EditorContentType.ITALIC]: <TextItalicIcon className="w-5 h-5" />,
  [EditorContentType.UNDERLINE]: <TextUnderlineIcon className="w-5 h-5" />,
  [EditorContentType.CODE]: <CodeIcon className="w-5 h-5" />,
  [EditorContentType.HEADING]: <TextHOneIcon className="w-7 h-7" />,
  [EditorContentType.EQUATION]: <FunctionIcon className="w-5 h-5" />,
  [EditorContentType.LIST]: <ListBulletsIcon className="w-5 h-5" />,
  [EditorContentType.ORDERED_LIST]: <ListNumbersIcon className="w-5 h-5" />,
  [EditorContentType.LINK]: <LinkIcon className="w-5 h-5" />,
  [EditorContentType.IMAGE]: <ImageIcon className="w-5 h-5" />,
  [EditorContentType.ALIGN_LEFT]: <TextAlignLeftIcon className="w-5 h-5" />,
  [EditorContentType.ALIGN_CENTER]: <TextAlignCenterIcon className="w-5 h-5" />,
  [EditorContentType.ALIGN_RIGHT]: <TextAlignRightIcon className="w-5 h-5" />,
  [EditorContentType.SYMBOL]: <FunctionIcon className="w-5 h-5" />,
};

export const splitTextAndMath = (input: string) => {
  const regex = /(\$\$.*?\$\$)/g;
  const parts = input
    .split(regex)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts;
};

export const getBlocks = (html: string): Block[] => {
  const isBlocks = html.startsWith('[');
  const blocks = isBlocks ? JSON.parse(html) : [{ type: EditorContentType.TEXT, content: html }];
  return blocks;
};
