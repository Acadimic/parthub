import { CheckIcon, CopyIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { Button, DrawerSection, TextArea } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { errorToast } from '@utils/helpers';
import { useEffect, useState } from 'react';

/** One prompt in a pack: a stable key, a title for the list, the text. */
export interface IPromptPackItem {
  key: string;
  title: string;
  prompt: string;
}

interface IProps {
  packs: IPromptPackItem[];
  /** The list's heading; defaults to "N prompts, one per subject". */
  heading?: string;
  hint?: string;
  /** The tips box; omit for the default whole-subject tips. */
  tips?: string[];
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'prompt';

const download = (pack: IPromptPackItem) => {
  const blob = new Blob([pack.prompt], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slug(pack.title)}-prompt.md`;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Step two of a whole-standard run: one prompt per subject. Each is a separate conversation with
 * the model — a whole subject already fills a reply, so several subjects in one would be cut off.
 */
const DEFAULT_TIPS = [
  'Use the most capable model you have, with web search on, so the syllabus and references are real.',
  'A long set may come back in parts. Reply "continue" until the model says it is done, and add every part.',
  'If the import reports issues, paste them back and ask for the corrected lessons only.',
];

export const AiPromptPackStep = ({ packs, heading, hint, tips = DEFAULT_TIPS }: IProps) => {
  const [selected, setSelected] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const current = packs[Math.min(selected, packs.length - 1)];

  useEffect(() => {
    if (!copiedKey) return undefined;
    const timer = setTimeout(() => setCopiedKey(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedKey]);

  const copy = async (pack: IPromptPackItem) => {
    try {
      await navigator.clipboard.writeText(pack.prompt);
      setCopiedKey(pack.key);
    } catch {
      errorToast({ message: 'Could not copy. Select the text and copy it by hand.' });
    }
  };

  const downloadAll = () => {
    // One file per subject; a browser allows several downloads from one click when they are
    // started together.
    packs.forEach((pack) => download(pack));
  };

  if (!current) return null;

  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title={heading ?? `${packs.length} ${packs.length === 1 ? 'prompt' : 'prompts'}, one per subject`}
        hint={
          hint ??
          'Run each in its own chat with a model that has web search. Every reply is imported in the next step; you can import them as they arrive.'
        }
        action={
          packs.length > 1 ? (
            <Button
              isSecondary
              text="Download all"
              leftsection={<DownloadSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={downloadAll}
            />
          ) : null
        }
      >
        <ul className="flex flex-col gap-1.5">
          {packs.map((pack, index) => {
            const { key } = pack;
            const isCurrent = index === selected;
            return (
              <li
                key={key}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2',
                  isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border bg-background',
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelected(index)}
                  className="min-w-0 flex-1 text-left"
                  aria-pressed={isCurrent}
                >
                  <span className="block truncate text-sm font-medium text-foreground">{pack.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {Math.round(pack.prompt.length / 4).toLocaleString()} tokens, roughly
                  </span>
                </button>
                <Button
                  isSubtle
                  className="px-2 py-1 text-xs"
                  text="Download"
                  leftsection={<DownloadSimpleIcon weight="bold" className="h-3.5 w-3.5" />}
                  onClick={() => download(pack)}
                />
                <Button
                  isSecondary
                  className="px-2 py-1 text-xs"
                  text={copiedKey === key ? 'Copied' : 'Copy'}
                  leftsection={
                    copiedKey === key ? (
                      <CheckIcon weight="bold" className="h-3.5 w-3.5" />
                    ) : (
                      <CopyIcon weight="bold" className="h-3.5 w-3.5" />
                    )
                  }
                  onClick={() => copy(pack)}
                />
              </li>
            );
          })}
        </ul>
      </DrawerSection>
      <DrawerSection title={current.title} hint="The prompt for the subject selected above.">
        <TextArea
          value={current.prompt}
          readOnly
          rows={18}
          className="font-mono text-xs leading-5"
          aria-label={`Prompt for ${current.title}`}
        />
      </DrawerSection>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Tips</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
