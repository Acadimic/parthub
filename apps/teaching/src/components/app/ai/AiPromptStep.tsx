import { CheckIcon, CopyIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { Button, DrawerSection, TextArea } from '@repo/ui/app';
import { errorToast } from '@utils/helpers';
import { useEffect, useState } from 'react';

interface IProps {
  prompt: string;
  /** Used for the downloaded file's name. */
  fileName: string;
  /** What the model is asked for, for the tips box. */
  subject?: 'paper' | 'lessons';
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'prompt';

/** Step two: the prompt to paste into a model, with copy and download so it is never retyped. */
export const AiPromptStep = ({ prompt, fileName, subject = 'paper' }: IProps) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return undefined;
    const timer = setTimeout(() => setIsCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
    } catch {
      errorToast({ message: 'Could not copy. Select the text and copy it by hand.' });
    }
  };

  const download = () => {
    const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug(fileName)}-prompt.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="Your prompt"
        hint="Paste it into ChatGPT, Claude, Gemini or any other model. The reply is the JSON you import in the next step."
        action={
          <div className="flex items-center gap-2">
            <Button
              isSecondary
              text="Download .md"
              leftsection={<DownloadSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={download}
            />
            <Button
              text={isCopied ? 'Copied' : 'Copy prompt'}
              leftsection={
                isCopied ? (
                  <CheckIcon weight="bold" className="h-4 w-4" />
                ) : (
                  <CopyIcon weight="bold" className="h-4 w-4" />
                )
              }
              onClick={copy}
            />
          </div>
        }
      >
        <TextArea value={prompt} readOnly rows={26} className="font-mono text-xs leading-5" aria-label="Prompt" />
      </DrawerSection>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">
          Tips for a better {subject === 'paper' ? 'paper' : 'set of lessons'}
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Use the most capable model you have; long, structured JSON is where small models slip.</li>
          <li>If the reply is cut off, ask: "Continue the JSON from where you stopped" and join the parts.</li>
          <li>If the import reports issues, paste them back to the model and ask it to return the corrected JSON.</li>
          <li>
            {subject === 'paper'
              ? 'Ask for a second version of any weak question rather than editing the JSON by hand.'
              : 'Use a model with web search turned on, so the references are pages it has really seen.'}
          </li>
        </ul>
      </div>
    </div>
  );
};
