export enum GREEK {
  ALPHA = '\\alpha',
  BETA = '\\beta',
  GAMMA = '\\gamma',
  DELTA = '\\delta',
  EPSILON = '\\epsilon',
  ZETA = '\\zeta',
  ETA = '\\eta',
  THETA = '\\theta',
  IOTA = '\\iota',
  KAPPA = '\\kappa',
  LAMBDA = '\\lambda',
  MU = '\\mu',
  NU = '\\nu',
  XI = '\\xi',
  OMICRON = '\\omicron',
  PI = '\\pi',
  RHO = '\\rho',
  SIGMA = '\\sigma',
  TAU = '\\tau',
  UPSILON = '\\upsilon',
  PHI = '\\phi',
  CHI = '\\chi',
  PSI = '\\psi',
  OMEGA = '\\omega',

  // Capital
  GAMMA_UPPER = '\\Gamma',
  DELTA_UPPER = '\\Delta',
  THETA_UPPER = '\\Theta',
  LAMBDA_UPPER = '\\Lambda',
  XI_UPPER = '\\Xi',
  PI_UPPER = '\\Pi',
  SIGMA_UPPER = '\\Sigma',
  UPSILON_UPPER = '\\Upsilon',
  PHI_UPPER = '\\Phi',
  PSI_UPPER = '\\Psi',
  OMEGA_UPPER = '\\Omega',
}

export enum OPERATORS {
  PLUS = '+',
  MINUS = '-',
  TIMES = '\\times',
  CDOT = '\\cdot',
  DIV = '\\div',
  PM = '\\pm',
  MP = '\\mp',
  INFINITY = '\\infty',
  AST = '\\ast',
  STAR = '\\star',
  CUP = '\\cup',
  CAP = '\\cap',
  VEE = '\\vee',
  WEDGE = '\\wedge',
  OPLUS = '\\oplus',
  OTIMES = '\\otimes',
  ODOT = '\\odot',
  SUM = '\\sum',
  PROD = '\\prod',
  INT = '\\int',
  IINT = '\\iint',
  IIINT = '\\iiint',
  OINT = '\\oint',
  LIM = '\\lim',
}

export enum RELATIONS {
  EQUAL = '=',
  NOT_EQUAL = '\\neq',
  APPROX = '\\approx',
  EQUIV = '\\equiv',
  LESS = '<',
  GREATER = '>',
  LESS_EQUAL = '\\leq',
  GREATER_EQUAL = '\\geq',
  SUBSET = '\\subset',
  SUPERSET = '\\supset',
  IN = '\\in',
  NOT_IN = '\\notin',
  SUBSET_EQUAL = '\\subseteq',
  SUPERSET_EQUAL = '\\supseteq',
  EXISTS = '\\exists',
  NOT_EXISTS = '\\nexists',
  FORALL = '\\forall',
  PROPORTIONAL = '\\propto',
  SIMILAR = '\\sim',
  PARALLEL = '\\parallel',
  PERPENDICULAR = '\\perp',
}

export enum ARROWS {
  LEFT = '\\leftarrow',
  RIGHT = '\\rightarrow',
  UP = '\\uparrow',
  DOWN = '\\downarrow',
  LEFT_RIGHT = '\\leftrightarrow',
  LONG_LEFT = '\\longleftarrow',
  LONG_RIGHT = '\\longrightarrow',
  MAPSTO = '\\mapsto',
  RIGHT_ARROW_DOUBLE = '\\Rightarrow',
  LEFT_ARROW_DOUBLE = '\\Leftarrow',
  LEFT_RIGHT_DOUBLE = '\\Leftrightarrow',
  NE_ARROW = '\\nearrow',
  SE_ARROW = '\\searrow',
  NW_ARROW = '\\nwarrow',
  SW_ARROW = '\\swarrow',
}

// export enum ACCENTS {
//   HAT = '\\hat{x}',
//   BAR = '\\bar{x}',
//   VEC = '\\vec{x}',
//   DOT = '\\dot{x}',
//   DDOT = '\\ddot{x}',
//   TILDE = '\\tilde{x}',
//   OVERBRACE = '\\overbrace{a+b}^{text}',
//   UNDERBRACE = '\\underbrace{a+b}_{text}',
//   OVERLINE = '\\overline{xyz}',
//   UNDERLINE = '\\underline{xyz}',
// }

export enum SPECIAL {
  ALEPH = '\\aleph',
  HBAR = '\\hbar',
  NABLA = '\\nabla',
  PARTIAL = '\\partial',
  IMATH = '\\imath',
  JMATH = '\\jmath',
  ELL = '\\ell',
  RE = '\\Re',
  IM = '\\Im',
  INFINITY = '\\infty',
  EMPTYSET = '\\emptyset',
  VARNOTHING = '\\varnothing',
  TRIANGLE = '\\triangle',
  ANGLE = '\\angle',
  MEASURED_ANGLE = '\\measuredangle',
}

// \big( x \big) \quad \Big( x \Big) \quad \bigg( x \bigg) \quad \Bigg( x \Bigg)
export enum BRACKETS_SIZE {
  SMALL = '\\big',
  MEDIUM = '\\Big',
  LARGE = '\\bigg',
  LARGEST = '\\Bigg',
}

export enum BRACKETS_TYPE {
  LEFT = '\\left',
  RIGHT = '\\right',
}

// \langle x \rangle   \quad \lfloor x \rfloor   \quad \lceil x \rceil
// \left| x \right|   \quad \left\| x \right\|

export enum ANGLE_BRACKETS {
  LEFT_ANGLE = '\\langle',
  LEFT_FLOOR = '\\lfloor',
  LEFT_CEILING = '\\lceil',
  RIGHT_ANGLE = '\\rangle',
  RIGHT_FLOOR = '\\rfloor',
  RIGHT_CEILING = '\\rceil',
}

export enum BRACKETS {
  LEFT_PARENTHESIS = '(',
  RIGHT_PARENTHESIS = ')',
  LEFT_BRACKET = '[',
  RIGHT_BRACKET = ']',
  LEFT_CURLY_BRACE = '\\{',
  RIGHT_CURLY_BRACE = '\\}',
  ABSOLUTE_VALUE = '|',
  NORMAL_VALUE = '\\|',
}

export enum TRIGONOMETRIC {
  SIN = '\\sin',
  COS = '\\cos',
  TAN = '\\tan',
  CSC = '\\csc',
  SEC = '\\sec',
  COT = '\\cot',
}
