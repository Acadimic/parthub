import { Tooltip as CoreTooltip } from '../../core/Tooltip';
import * as React from 'react';

interface IProps {
  children: React.ReactNode | string;
  title?: React.ReactNode | string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * The same `title`/`children` shape as before, now on the Radix tooltip from `core`. The old
 * version was a CSS `:hover` box positioned inside the trigger, so it was clipped by any
 * `overflow-hidden` ancestor and centred on whatever wrapper it happened to be in; this one is
 * portaled, placed against the trigger, and shows on focus as well as hover.
 */
export const Tooltip = ({ children, title, placement }: IProps) => {
  return (
    <CoreTooltip title={title} placement={placement}>
      {children}
    </CoreTooltip>
  );
};
