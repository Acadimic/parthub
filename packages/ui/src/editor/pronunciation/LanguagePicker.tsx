import { CaretDownIcon, CheckIcon, MagnifyingGlassIcon, TranslateIcon } from '@phosphor-icons/react';
import { SPEECH_LANGUAGES, speechLanguageName } from '@repo/shared/utils';
import { useState } from 'react';
import { cn } from '../../lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { CONTROL_CLASS, keepSelection } from '../toolbar/ToolbarButton';
import { lastLanguage } from './last-language';

interface IProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

/**
 * The language a run or a block is spoken in. A searchable list rather than a plain menu: the
 * registry grows, and an author looking for Sanskrit types "san" or "संस्" rather than scrolling.
 */
export const LanguagePicker = ({ value, onChange, className }: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const options = SPEECH_LANGUAGES.filter(
    (language) =>
      !needle ||
      language.name.toLowerCase().includes(needle) ||
      language.nativeName.toLowerCase().includes(needle) ||
      language.code.toLowerCase().includes(needle),
  );

  const choose = (code: string) => {
    lastLanguage.set(code);
    onChange(code);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={keepSelection}
          aria-label={`Language: ${speechLanguageName(value)}`}
          className={cn(
            CONTROL_CLASS,
            'gap-1.5 border border-border bg-background px-2 text-foreground hover:bg-accent',
            className,
          )}
        >
          <TranslateIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[9rem] truncate">{value ? speechLanguageName(value) : 'Language'}</span>
          <CaretDownIcon className="h-3 w-3 text-muted-foreground" weight="bold" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0" onCloseAutoFocus={(event) => event.preventDefault()}>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <MagnifyingGlassIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && options[0] && choose(options[0].code)}
            placeholder="Search languages"
            aria-label="Search languages"
            className="h-9 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto py-1" role="listbox" aria-label="Languages">
          {options.map((language) => {
            const isCurrent = language.code === value;
            return (
              <li key={language.code} role="option" aria-selected={isCurrent}>
                <button
                  type="button"
                  onClick={() => choose(language.code)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                    isCurrent ? 'text-primary' : 'text-foreground',
                  )}
                >
                  <span className="flex-1 truncate">{language.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{language.nativeName}</span>
                  <CheckIcon className={cn('h-3.5 w-3.5', isCurrent ? 'opacity-100' : 'opacity-0')} weight="bold" />
                </button>
              </li>
            );
          })}
          {!options.length ? <li className="px-3 py-2 text-xs text-muted-foreground">No language matches.</li> : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
