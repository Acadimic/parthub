import { getAlphabet } from '@utils/helpers';
import { type ReactNode } from 'react';

/**
 * An option's letter, then its body. The letter takes the primary colour while the row it sits in
 * is selected — the row sets `data-selected` and carries the `group` class.
 */
export const Option = ({ index, children }: { index: number; children: ReactNode }) => {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-4 shrink-0 pt-0.5 text-xs font-bold leading-5 text-muted-foreground group-data-[selected=true]:text-primary">
        {getAlphabet(index)}
      </span>
      <div className="min-w-0 flex-1 leading-6 [&_p]:my-0 [&_p]:leading-6">{children}</div>
    </div>
  );
};
