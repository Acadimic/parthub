import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

/**
 * Two independent axes — `tone` says which token, `appearance` says how much of it to use — rather
 * than one `variant` enum with a member per combination. Seven tones times three appearances is 21
 * members to hand-write and keep in step; as axes it is ten lines, and adding a tone does not touch
 * the appearances.
 *
 * `soft` is the default because a status pill is read in bulk — a table column of them — and solid
 * fills at that density turn a list into a stack of colour bars. It is built from alpha modifiers
 * (`bg-success/15`), which only resolve because the palette is emitted as bare HSL channels; see
 * `themes/tailwind.ts` before changing how a token is stored.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      tone: {
        neutral: '',
        primary: '',
        success: '',
        warning: '',
        destructive: '',
        info: '',
        brand: '',
      },
      appearance: {
        soft: '',
        solid: 'border-transparent',
        outline: 'bg-transparent',
      },
    },
    compoundVariants: [
      { tone: 'neutral', appearance: 'soft', class: 'bg-muted-foreground/15 text-foreground border-border' },
      { tone: 'primary', appearance: 'soft', class: 'bg-primary/15 text-primary border-primary/25' },
      { tone: 'success', appearance: 'soft', class: 'bg-success/15 text-success border-success/25' },
      { tone: 'warning', appearance: 'soft', class: 'bg-warning/15 text-warning border-warning/25' },
      { tone: 'destructive', appearance: 'soft', class: 'bg-destructive/15 text-destructive border-destructive/25' },
      { tone: 'info', appearance: 'soft', class: 'bg-info/15 text-info border-info/25' },
      { tone: 'brand', appearance: 'soft', class: 'bg-brand/15 text-brand border-brand/25' },

      { tone: 'neutral', appearance: 'solid', class: 'bg-secondary text-secondary-foreground' },
      { tone: 'primary', appearance: 'solid', class: 'bg-primary text-primary-foreground' },
      { tone: 'success', appearance: 'solid', class: 'bg-success text-success-foreground' },
      { tone: 'warning', appearance: 'solid', class: 'bg-warning text-warning-foreground' },
      { tone: 'destructive', appearance: 'solid', class: 'bg-destructive text-destructive-foreground' },
      { tone: 'info', appearance: 'solid', class: 'bg-info text-info-foreground' },
      { tone: 'brand', appearance: 'solid', class: 'bg-brand text-brand-foreground' },

      { tone: 'neutral', appearance: 'outline', class: 'text-muted-foreground border-border' },
      { tone: 'primary', appearance: 'outline', class: 'text-primary border-primary/40' },
      { tone: 'success', appearance: 'outline', class: 'text-success border-success/40' },
      { tone: 'warning', appearance: 'outline', class: 'text-warning border-warning/40' },
      { tone: 'destructive', appearance: 'outline', class: 'text-destructive border-destructive/40' },
      { tone: 'info', appearance: 'outline', class: 'text-info border-info/40' },
      { tone: 'brand', appearance: 'outline', class: 'text-brand border-brand/40' },
    ],
    defaultVariants: {
      tone: 'neutral',
      appearance: 'soft',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, appearance, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, appearance }), className)} {...props} />;
}

export { Badge, badgeVariants };
