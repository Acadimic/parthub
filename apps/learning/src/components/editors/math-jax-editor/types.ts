export enum EditorContentType {
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  UNDO = 'undo',
  REDO = 'redo',
  TEXT = 'text',
  CODE = 'code',
  CONTENT = 'content',
  HEADING = 'heading',
  EQUATION = 'equation',
  LIST = 'list',
  ORDERED_LIST = 'ordered-list',
  LINK = 'link',
  IMAGE = 'image',
  ALIGN_LEFT = 'align-left',
  ALIGN_CENTER = 'align-center',
  ALIGN_RIGHT = 'align-right',
  SYMBOL = 'symbol',
}

export enum EquationType {
  TEXT = 'text',
  SUPERSCRIPT = 'superscript',
  SUBSCRIPT = 'subscript',
  FRACTION = 'fraction',
  MATRIX = 'matrix',
  DETERMINANT = 'determinant',
  TABLE = 'table',
  ROOT = 'root',
  CUBE_ROOT = 'cube-root',
  SUM = 'sum',
  PRODUCT = 'product',
  INTEGRAL = 'integral',
  LIMIT = 'limit',
  LOG = 'log',
  EXP = 'exp',
  SIN = 'sin',
  COS = 'cos',
  TAN = 'tan',
  CSC = 'csc',
  SEC = 'sec',
  COT = 'cot',
  VECTOR = 'vector',
  UNIT_VECTOR = 'unit-vector',
  SYMBOL = 'symbol',
}

interface BlockNode {
  type: EditorContentType;
  className?: string;
}

export interface TextNode extends BlockNode {
  type: EditorContentType.TEXT;
  content: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface CodeNode extends BlockNode {
  type: EditorContentType.CODE;
  content: string;
  language: string;
}

export interface HeadingNode extends BlockNode {
  type: EditorContentType.HEADING;
  content: Block[];
  level: number;
}

export interface ContentNode extends BlockNode {
  type: EditorContentType.CONTENT;
  content: Block[];
}

export interface ListNode extends BlockNode {
  type: EditorContentType.LIST;
  content: Block[];
  isOrdered: false;
  items: Block[][];
}

export interface OrderedListNode extends BlockNode {
  type: EditorContentType.ORDERED_LIST;
  content: Block[];
  isOrdered: true;
  items: Block[][];
}

export interface LinkNode extends BlockNode {
  type: EditorContentType.LINK;
  content: Block[];
  href: string;
  isInline: boolean;
}

export interface ImageNode extends BlockNode {
  type: EditorContentType.IMAGE;
  data?: string; // Base64 data
  url?: string; // Source URL
}

export interface SymbolNode extends BlockNode {
  type: EditorContentType.SYMBOL;
  name: string;
  content: string;
}

// Equation Nodes

export interface TextEquationNode {
  type: EquationType.TEXT;
  content: string;
}

export interface SuperscriptNode {
  type: EquationType.SUPERSCRIPT;
  content: EquationBlock[]; // base
  exponent: EquationBlock[]; // superscript
}

export interface SubscriptNode {
  type: EquationType.SUBSCRIPT;
  content: EquationBlock[]; // base
  base: EquationBlock[]; // subscript
}

export interface RootNode {
  type: EquationType.ROOT;
  content: EquationBlock[]; // radicand
  index: string;
}

export interface FractionNode {
  type: EquationType.FRACTION;
  numerator: EquationBlock[];
  denominator: EquationBlock[];
}

export interface MatrixNode {
  type: EquationType.MATRIX;
  rows: EquationBlock[][][];
}

export interface DeterminantNode {
  type: EquationType.DETERMINANT;
  rows: EquationBlock[][][];
}

export interface LimitNode {
  type: EquationType.LIMIT;
  content: EquationBlock[];
  left: EquationBlock[];
  right: EquationBlock[];
}

export interface TableNode {
  type: EquationType.TABLE;
  rows: EquationBlock[][][];
  isBordered: boolean;
}

export interface IntegralNode {
  type: EquationType.INTEGRAL;
  content: EquationBlock[];
  top: EquationBlock[];
  bottom: EquationBlock[];
}

export interface SymbolEquationNode {
  type: EquationType.SYMBOL;
  name: string;
  content: string;
}

export type EquationBlock =
  | TextEquationNode
  | FractionNode
  | MatrixNode
  | DeterminantNode
  | TableNode
  | RootNode
  | SuperscriptNode
  | SubscriptNode
  | SymbolEquationNode
  | LimitNode
  | IntegralNode;

export interface EquationNode extends BlockNode {
  type: EditorContentType.EQUATION;
  blocks: EquationBlock[];
}

export type Block =
  | TextNode
  | ContentNode
  | CodeNode
  | HeadingNode
  | EquationNode
  | ListNode
  | OrderedListNode
  | LinkNode
  | ImageNode
  | SymbolNode;

export interface EditorContent {
  blocks: Block[];
}
