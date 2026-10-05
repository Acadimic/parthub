/** The wordmark every app serves from `public/images`, as `FullLogo` does. */
export const ACADIMIC_LOGO = '/images/acadimic-light.svg';

/** A real link in the saved PDF: Chrome keeps an anchor's target when it prints to a file. */
export const AcadimicLink = ({ className }: { className: string }) => (
  <a href="https://www.acadimic.com" className={className}>
    www.acadimic.com
  </a>
);

export const formatPrintDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * The panel that closes every printout: the logo, where it was made, and — for a course anyone can
 * open — the course's own address, a live link in the saved PDF.
 */
export const PrintClosing = ({ courseUrl }: { courseUrl: string | null }) => (
  <div className="mt-12 rounded-xl border border-border px-7 py-6 break-inside-avoid max-sm:px-4">
    <div className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:gap-3 max-sm:text-center">
      <img src={ACADIMIC_LOGO} alt="Acadimic" className="h-[7mm] w-auto" />
      <p className="text-right text-[9pt] text-muted-foreground max-sm:text-center">
        Created and printed with Acadimic
        <br />
        <AcadimicLink className="text-[10.5pt] font-bold text-primary" />
      </p>
    </div>
    {courseUrl ? (
      <p className="mt-5 border-t border-border pt-4 text-[9pt] text-muted-foreground max-sm:text-center">
        Open this course on Acadimic
        <br />
        <a href={courseUrl} className="break-all text-[10pt] font-semibold text-primary">
          {courseUrl}
        </a>
      </p>
    ) : null}
  </div>
);
