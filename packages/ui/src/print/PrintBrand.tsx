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

/** The panel that closes every printout: the logo, and where it was made. */
export const PrintClosing = () => (
  <div className="mt-12 flex items-center justify-between gap-6 rounded-xl border border-border px-7 py-6 break-inside-avoid max-sm:flex-col max-sm:gap-3 max-sm:px-4 max-sm:text-center">
    <img src={ACADIMIC_LOGO} alt="Acadimic" className="h-[7mm] w-auto" />
    <p className="text-right text-[9pt] text-muted-foreground max-sm:text-center">
      Created and printed with Acadimic
      <br />
      <AcadimicLink className="text-[10.5pt] font-bold text-primary" />
    </p>
  </div>
);
