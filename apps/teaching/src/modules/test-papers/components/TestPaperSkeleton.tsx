import { RectangleSkeleton } from '@repo/ui/app';

/** A question row's outline while the section is loading. */
const QuestionRowSkeleton = () => (
  <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-3">
    <RectangleSkeleton width={32} height={24} />
    <div className="flex flex-1 flex-col gap-2">
      <RectangleSkeleton width="70%" height={14} />
      <RectangleSkeleton width="35%" height={12} />
    </div>
  </div>
);

/**
 * The paper page's shape, drawn in placeholders, for the moment before the paper and its
 * questions arrive. The header, stats strip and one section with three rows mirror the loaded
 * layout so nothing jumps when the data lands.
 */
export const TestPaperSkeleton = ({ withHeader = true }: { withHeader?: boolean }) => (
  <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading test paper">
    {withHeader ? (
      <div className="rounded-lg border border-border bg-background p-5">
        <div className="flex flex-col gap-3">
          <RectangleSkeleton width="40%" height={22} />
          <RectangleSkeleton width="25%" height={14} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <RectangleSkeleton key={index} height={56} />
          ))}
        </div>
      </div>
    ) : null}
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <RectangleSkeleton width="30%" height={16} />
        <RectangleSkeleton width={120} height={30} />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <QuestionRowSkeleton />
        <QuestionRowSkeleton />
        <QuestionRowSkeleton />
      </div>
    </div>
  </div>
);
