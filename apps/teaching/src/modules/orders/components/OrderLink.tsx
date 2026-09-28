import { Button, Tooltip } from '@repo/ui/app';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { successToast } from '@utils/helpers';
import { useEffect, useState } from 'react';
import { getOrderLink } from '../order.utils';

interface IProps {
  code: string;
  /** Full: the whole link in a copyable box. Compact: the code and a copy icon, for a table cell. */
  isCompact?: boolean;
}

/** An order's link, with a one-tap copy. */
export const OrderLink = ({ code, isCompact = false }: IProps) => {
  const link = getOrderLink(code);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return undefined;
    const timer = setTimeout(() => setIsCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setIsCopied(true);
    successToast({ message: 'Order link copied.' });
  };

  const icon = isCopied ? (
    <CheckIcon weight="bold" className="w-4 h-4 text-success" />
  ) : (
    <CopyIcon weight="bold" className="w-4 h-4" />
  );

  if (isCompact) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs">{code}</span>
        <Tooltip title="Copy link">
          <Button isSubtle aria-label="Copy order link" className="p-1" onClick={copy} leftsection={icon} />
        </Tooltip>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{link}</span>
      <Button isSecondary className="px-2.5 py-1.5 text-xs" onClick={copy} leftsection={icon}>
        {isCopied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
};
