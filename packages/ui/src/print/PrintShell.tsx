import { PrinterIcon, XIcon } from '@phosphor-icons/react';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Button } from '../app/buttons/Buttons';
import { Spinner } from '../app/loaders/Spinner';
import { cn } from '../lib/cn';
import { RichTextMediaContext, useRichTextMedia } from '../contexts/rich-text-media-context';
import { buildPrintCss, type IPageText, PRINT_FONT } from './print-styles';
import { usePrintReady } from './use-print-ready';

export interface IPrintShellProps extends IPageText {
  /** The tab title while the page is open, which is also the saved PDF's default file name. */
  documentTitle: string;
  /** False while the data is loading; the dialog opens only once it and every picture are in. */
  isLoaded: boolean;
  /** Controls beside the Print button, such as the version picker. */
  controls: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The frame every printout shares: a toolbar on screen, A4 sheets in print, the page footer, the
 * watermark, and light colours whatever the app's theme. It opens the print dialog by
 * itself once everything has loaded, so Print in the app is one click to the dialog.
 */
export const PrintShell = ({ documentTitle, footer, isLoaded, controls, onClose, children }: IPrintShellProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const isReady = usePrintReady(sheetRef, isLoaded);
  const hasPrinted = useRef(false);
  const media = useRichTextMedia();
  // Lazy images below the fold are not fetched before the print snapshot, so this tree loads all.
  const eagerMedia = useMemo(() => ({ ...media, imageLoading: 'eager' as const }), [media]);

  useEffect(() => {
    const previous = document.title;
    document.title = documentTitle;
    return () => {
      document.title = previous;
    };
  }, [documentTitle]);

  useEffect(() => {
    if (!isReady || hasPrinted.current) return;
    hasPrinted.current = true;
    window.print();
  }, [isReady]);

  return (
    <div
      data-theme="light"
      style={{ fontFamily: PRINT_FONT }}
      className="min-h-screen bg-muted text-foreground print:min-h-0 print:bg-transparent"
    >
      <style>{buildPrintCss({ footer })}</style>
      <div className="print-watermark" aria-hidden="true">
        <span>ACADIMIC</span>
      </div>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur max-sm:gap-2 max-sm:px-3 print:hidden">
        <Button isSubtle text="Close" onClick={onClose} leftsection={<XIcon weight="bold" className="h-4 w-4" />} />
        {/* On a phone: Close and Print share the first row, and the controls take a row of their own. */}
        <div className="flex flex-wrap items-center gap-2 max-sm:order-3 max-sm:w-full">{controls}</div>
        <span className="ml-auto hidden text-xs text-muted-foreground md:inline">
          Choose “Save as PDF” as the printer to download a file.
        </span>
        <Button
          text={isReady ? 'Print / Save PDF' : 'Preparing…'}
          disabled={!isReady}
          onClick={() => window.print()}
          className="px-3 py-1.5 md:px-4 max-sm:order-2 max-sm:ml-auto"
          leftsection={isReady ? <PrinterIcon weight="bold" className="h-4 w-4" /> : <Spinner className="h-4 w-4" />}
        />
      </div>
      <RichTextMediaContext.Provider value={eagerMedia}>
        <div
          ref={sheetRef}
          className="print-exact mx-auto flex max-w-[210mm] flex-col gap-8 px-4 py-8 text-[10.5pt] leading-[1.55] max-sm:gap-4 max-sm:px-2 max-sm:py-4 print:block print:max-w-none print:p-0 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden"
        >
          {isLoaded ? (
            children
          ) : (
            <div className="mt-24 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
              <Spinner className="h-8 w-8" />
              <p>Getting everything ready to print…</p>
              <p className="text-xs">A long course can take up to a minute; the print dialog opens by itself.</p>
            </div>
          )}
        </div>
      </RichTextMediaContext.Provider>
    </div>
  );
};

/**
 * One sheet on screen. In print the sheets flow into each other and the browser paginates; a sheet
 * marked `isNewPage` starts on a fresh page.
 */
export const PrintSheet = ({ isNewPage, children }: { isNewPage: boolean; children: ReactNode }) => (
  <section
    className={cn(
      'min-w-0 rounded-md bg-card px-[16mm] py-[18mm] shadow-sm max-sm:px-4 max-sm:py-6 print:rounded-none print:bg-transparent print:p-0 print:shadow-none',
      isNewPage && 'print:break-before-page',
    )}
  >
    {children}
  </section>
);

export interface IPrintOption<T extends string> {
  value: T;
  label: string;
}

/** A row of toggle buttons for the toolbar: which version of the document to print. */
export const PrintOptionPicker = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: IPrintOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className="flex flex-wrap gap-1.5 max-sm:w-full max-sm:flex-nowrap" role="radiogroup">
    {options.map((option) => (
      <Button
        key={option.value}
        role="radio"
        aria-checked={option.value === value}
        isSecondary={option.value !== value}
        text={option.label}
        // A phone gives each option an equal share of one row rather than wrapping them unevenly.
        className="px-3 py-1.5 md:px-4 max-sm:min-w-0 max-sm:flex-1 max-sm:px-1.5 max-sm:text-xs"
        onClick={() => onChange(option.value)}
      />
    ))}
  </div>
);
