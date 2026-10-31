import { CaretDownIcon, CheckIcon, CodeIcon } from '@phosphor-icons/react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import { CODE_LANGUAGES, codeLanguageLabel } from '../../content/code-languages';
import { cn } from '../../lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { CONTROL_CLASS, keepSelection } from '../toolbar/ToolbarButton';

/** The options, with "None" first so an author can take a language off again. */
const OPTIONS = [{ value: '', label: 'None' }, ...CODE_LANGUAGES];

/**
 * A code block in the editor: the language it is written in above the code, chosen from the list
 * the reader colours. The code itself stays plain here; the reader shows it highlighted.
 */
export const CodeBlockNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const language = String(node.attrs.language ?? '');

  const choose = (value: string) => {
    updateAttributes({ language: value || null });
    setIsOpen(false);
  };

  return (
    <NodeViewWrapper className="my-3 overflow-hidden rounded-lg border border-code-header bg-code text-code-foreground">
      <div contentEditable={false} className="flex items-center bg-code-header px-2 py-1">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onMouseDown={keepSelection}
              aria-label={`Code language: ${codeLanguageLabel(language)}`}
              className={cn(
                CONTROL_CLASS,
                'gap-1.5 px-2 text-code-header-foreground hover:bg-code hover:text-code-foreground',
              )}
            >
              <CodeIcon className="h-3.5 w-3.5" />
              <span className="uppercase tracking-caps">{codeLanguageLabel(language)}</span>
              <CaretDownIcon className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1">
            {OPTIONS.map((option) => (
              <button
                key={option.value || 'none'}
                type="button"
                onMouseDown={keepSelection}
                onClick={() => choose(option.value)}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                {option.label}
                {option.value === language ? <CheckIcon weight="bold" className="h-3.5 w-3.5 text-primary" /> : null}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
      <pre className="m-0 overflow-x-auto p-3 font-mono text-xs leading-relaxed [&&]:bg-transparent [&&]:text-code-foreground">
        <NodeViewContent<'code'> as="code" className="block" />
      </pre>
    </NodeViewWrapper>
  );
};
