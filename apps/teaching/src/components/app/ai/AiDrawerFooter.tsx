import { ArrowLeftIcon, ArrowRightIcon, SparkleIcon } from '@phosphor-icons/react';
import { Button } from '@repo/ui/app';

interface IProps {
  /** Shown beside Close: what is planned, or which step this is. */
  note: string;
  isFirstStep: boolean;
  isLastStep: boolean;
  /** The forward button's text on the steps before the last. */
  nextLabel: string;
  importLabel: string;
  canImport: boolean;
  isImporting: boolean;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onImport: () => void;
}

/** The footer the AI drawers share: Close and a note on the left, Back and Next or Import on the right. */
export const AiDrawerFooter = ({
  note,
  isFirstStep,
  isLastStep,
  nextLabel,
  importLabel,
  canImport,
  isImporting,
  onClose,
  onBack,
  onNext,
  onImport,
}: IProps) => (
  <div className="flex w-full items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <Button isSubtle text="Close" onClick={onClose} disabled={isImporting} />
      <span className="hidden text-xs text-muted-foreground sm:inline">{note}</span>
    </div>
    <div className="flex items-center gap-2.5">
      {!isFirstStep ? (
        <Button
          isSecondary
          text="Back"
          leftsection={<ArrowLeftIcon weight="bold" className="h-4 w-4" />}
          onClick={onBack}
          disabled={isImporting}
        />
      ) : null}
      {isLastStep ? (
        <Button
          text={importLabel}
          leftsection={<SparkleIcon weight="bold" className="h-4 w-4" />}
          onClick={onImport}
          disabled={!canImport}
          isLoading={isImporting}
        />
      ) : (
        <Button text={nextLabel} rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />} onClick={onNext} />
      )}
    </div>
  </div>
);
