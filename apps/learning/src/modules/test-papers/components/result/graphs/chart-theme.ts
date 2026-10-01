import { Marking } from '@enums';
import { CheckIcon, CircleHalfIcon, type Icon, MinusIcon, XIcon } from '@phosphor-icons/react';

/**
 * The outcomes in the order every chart stacks and every legend lists them. The same status
 * tokens the question palette uses, so a colour means one thing across the sitting.
 */
export const MARKING_ORDER: Marking[] = [
  Marking.CORRECT,
  Marking.PARTIALLY_CORRECT,
  Marking.INCORRECT,
  Marking.UNATTEMPTED,
];

export const MARKING_LABELS: Record<Marking, string> = {
  [Marking.CORRECT]: 'Correct',
  [Marking.PARTIALLY_CORRECT]: 'Partially correct',
  [Marking.INCORRECT]: 'Incorrect',
  [Marking.UNATTEMPTED]: 'Unattempted',
};

export const MARKING_ICONS: Record<Marking, Icon> = {
  [Marking.CORRECT]: CheckIcon,
  [Marking.PARTIALLY_CORRECT]: CircleHalfIcon,
  [Marking.INCORRECT]: XIcon,
  [Marking.UNATTEMPTED]: MinusIcon,
};

/** SVG fills. The theme stores bare HSL channels, so each one is wrapped here. */
export const MARKING_FILLS: Record<Marking, string> = {
  [Marking.CORRECT]: 'hsl(var(--success))',
  [Marking.PARTIALLY_CORRECT]: 'hsl(var(--warning))',
  [Marking.INCORRECT]: 'hsl(var(--destructive))',
  [Marking.UNATTEMPTED]: 'hsl(var(--muted-foreground) / 0.35)',
};

/** The same colours as classes, for legend swatches and stacked bars drawn in HTML. */
export const MARKING_BG_CLASSES: Record<Marking, string> = {
  [Marking.CORRECT]: 'bg-success',
  [Marking.PARTIALLY_CORRECT]: 'bg-warning',
  [Marking.INCORRECT]: 'bg-destructive',
  [Marking.UNATTEMPTED]: 'bg-muted-foreground/35',
};

export const MARKING_TEXT_CLASSES: Record<Marking, string> = {
  [Marking.CORRECT]: 'text-success',
  [Marking.PARTIALLY_CORRECT]: 'text-warning',
  [Marking.INCORRECT]: 'text-destructive',
  [Marking.UNATTEMPTED]: 'text-muted-foreground',
};

export const CHART_SURFACE = 'hsl(var(--background))';
export const CHART_GRID = 'hsl(var(--border))';
export const CHART_MUTED_INK = 'hsl(var(--muted-foreground))';
export const CHART_CURSOR = 'hsl(var(--accent) / 0.6)';

export const AXIS_TICK = { fill: CHART_MUTED_INK, fontSize: 12 } as const;
