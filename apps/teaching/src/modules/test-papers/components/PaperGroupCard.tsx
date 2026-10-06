import { type TestPaperDto } from '@repo/shared/contracts';
import { DataTable } from '@components/app/tables';
import { type IColumnData } from '@interfaces';
import { CaretDownIcon } from '@phosphor-icons/react';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';

interface IProps {
  label: string;
  papers: TestPaperDto[];
  columns: IColumnData<TestPaperDto>[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenPaper: (paper: TestPaperDto) => void;
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** One standard's papers as a card: a header that folds it, and the papers' table inside. */
export const PaperGroupCard = ({ label, papers, columns, isOpen, onToggle, onOpenPaper }: IProps) => {
  const publishedCount = papers.filter((paper) => paper.isPublished).length;
  const questionsCount = papers.reduce((total, paper) => total + (paper.totalQuestions ?? 0), 0);

  return (
    // The card is a panel and the table inside keeps the base surface, so the two read apart.
    // `overflow-clip`, not `hidden`: a hidden overflow is a scroll box, and the header could not stick.
    <section className="min-w-0 overflow-clip rounded-lg border border-primary/20 bg-panel text-panel-foreground">
      {/* An open card's header sticks under the app bar while its table scrolls past; a closed one
          scrolls normally. The solid panel is on the wrapper so the button's translucent hover tint
          never lets rows show through. */}
      <div className={cn('bg-panel', isOpen && 'sticky top-0 z-20')}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <CaretDownIcon
            weight="bold"
            className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !isOpen && '-rotate-90')}
          />
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">{label}</span>
          <Badge tone="primary" appearance="soft">
            {papers.length}
          </Badge>
          <span className="ml-auto hidden shrink-0 text-xs text-muted-foreground sm:inline">
            {publishedCount} published · {plural(questionsCount, 'question')}
          </span>
        </button>
      </div>
      {isOpen ? (
        <DataTable
          rows={papers}
          columns={columns}
          height="content"
          onRowClick={onOpenPaper}
          // The card is the frame: the table drops its own border and rounding and sits under the header.
          className="rounded-none border-0 border-t"
        />
      ) : null}
    </section>
  );
};
