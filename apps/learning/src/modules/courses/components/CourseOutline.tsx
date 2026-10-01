import { ExpandAllButton } from '@repo/ui/app';
import { Accordion } from '@repo/ui/core';
import { useExpandedIds } from '@repo/ui/hooks';
import { cn } from '@repo/ui/lib';
import { BlankState } from '@components/others';
import { ModuleContentType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import { BookOpenTextIcon, CheckIcon, ClipboardTextIcon, LockSimpleIcon, VideoIcon } from '@phosphor-icons/react';
import {
  type ICourseModule,
  useCourseLookups,
  useMaterialLookups,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { getPlural } from '@utils/helpers';
import { useEffect } from 'react';

const ITEM_ICONS = {
  [ModuleContentType.VIDEO]: VideoIcon,
  [ModuleContentType.READING]: BookOpenTextIcon,
  [ModuleContentType.TEST_PAPER]: ClipboardTextIcon,
  [ModuleContentType.COMPLETED]: CheckIcon,
};

// Each kind's soft tint, its solid fill for the selected row, and its pill. Written out in full so
// Tailwind's purge keeps every class.
const ITEM_TONES = {
  [ModuleContentType.VIDEO]: {
    soft: 'bg-content-video/15 text-content-video ring-1 ring-inset ring-content-video/25',
    solid: 'bg-content-video text-content-video-foreground',
    pill: 'bg-content-video/10 text-content-video',
  },
  [ModuleContentType.READING]: {
    soft: 'bg-content-reading/15 text-content-reading ring-1 ring-inset ring-content-reading/25',
    solid: 'bg-content-reading text-content-reading-foreground',
    pill: 'bg-content-reading/10 text-content-reading',
  },
  [ModuleContentType.TEST_PAPER]: {
    soft: 'bg-content-test/15 text-content-test ring-1 ring-inset ring-content-test/25',
    solid: 'bg-content-test text-content-test-foreground',
    pill: 'bg-content-test/10 text-content-test',
  },
  [ModuleContentType.COMPLETED]: {
    soft: 'bg-muted text-muted-foreground',
    solid: 'bg-primary text-primary-foreground',
    pill: 'bg-muted text-muted-foreground',
  },
};

interface IProps {
  courseId: string;
  /** Wider spacing and module descriptions; the learning view keeps it dense. */
  isPreview: boolean;
  /** A priced course without a seat: rows show a lock instead of their kind, and do not open. */
  isLocked: boolean;
  onSelectItem: (item: ICourseModuleItem) => void;
}

interface IRowProps {
  item: ICourseModuleItem;
  isPreview: boolean;
  isLocked: boolean;
  onSelect: (item: ICourseModuleItem) => void;
}

/** The mark's fill: done is a quiet tinted tick, so a finished list does not shout; selected beats idle. */
const getMarkClass = (type: ModuleContentType, isCompleted: boolean, isSelected: boolean, isLocked: boolean) => {
  if (isCompleted) return 'bg-success/15 text-success';
  if (isLocked) return 'bg-muted text-muted-foreground';
  return isSelected ? ITEM_TONES[type].solid : ITEM_TONES[type].soft;
};

const OutlineItem = ({ item, isPreview, isLocked, onSelect }: IRowProps) => {
  const { getModuleContentType, isItemCompleted, isItemSelected } = useCourse();
  const type = getModuleContentType(item.material, item.testPaper);
  const isCompleted = isItemCompleted(item);
  const isSelected = !isPreview && isItemSelected(item);
  const details = item.material ?? item.testPaper;
  const RowIcon = isLocked ? LockSimpleIcon : ITEM_ICONS[isCompleted ? ModuleContentType.COMPLETED : type];

  return (
    <button
      type="button"
      aria-current={isSelected ? 'true' : undefined}
      aria-disabled={isLocked || undefined}
      onClick={() => !isLocked && onSelect(item)}
      className={cn(
        'flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/60',
        isSelected ? 'border-primary bg-accent' : 'border-transparent',
      )}
    >
      {/* The slot matches the module number's width, so the item marks centre under it. */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-colors',
            getMarkClass(type, isCompleted, isSelected, isLocked),
          )}
        >
          <RowIcon weight="bold" className="h-3.5 w-3.5" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{details?.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xxs text-muted-foreground/70">
          <span
            className={cn(
              'px-1 py-0.5 text-[0.5625rem] font-semibold uppercase leading-none tracking-caps',
              ITEM_TONES[type].pill,
            )}
          >
            {type}
          </span>
          <span aria-hidden className="h-[3px] w-[3px] rounded-full bg-muted-foreground/50" />
          {details?.durationMins ?? 0} min
        </span>
      </span>
    </button>
  );
};

/** An open module's mark fills solid, so the expanded panels stand out from the folded ones. */
const getModuleMarkClass = (isDone: boolean, isOpen: boolean) => {
  if (isDone) {
    return isOpen ? 'bg-success-fill text-success-fill-foreground' : 'bg-success/15 text-success';
  }
  return isOpen ? 'bg-primary-fill text-primary-fill-foreground' : 'bg-primary/10 text-primary';
};

/** One module's title, with its position and its own completion summary. */
const ModuleTitle = ({
  courseModule,
  index,
  itemCount,
  completedCount,
  isOpen,
}: {
  courseModule: ICourseModule;
  index: number;
  itemCount: number;
  completedCount: number;
  isOpen: boolean;
}) => {
  const isDone = itemCount > 0 && completedCount === itemCount;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold transition-colors',
          getModuleMarkClass(isDone, isOpen),
        )}
      >
        {isDone ? <CheckIcon weight="bold" className="h-3.5 w-3.5" /> : index + 1}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{courseModule.name}</span>
        <span className="block text-xxs font-normal text-muted-foreground/70">
          {itemCount ? `${completedCount} of ${itemCount} ${getPlural(itemCount, 'item')} done` : 'No items yet'}
        </span>
      </span>
    </span>
  );
};

/** The count of what the outline holds, and the one control that opens or folds every module. */
const OutlineToolbar = ({
  moduleCount,
  itemCount,
  isAllOpen,
  isSticky,
  onToggleAll,
}: {
  moduleCount: number;
  itemCount: number;
  isAllOpen: boolean;
  isSticky: boolean;
  onToggleAll: () => void;
}) => (
  <div
    className={cn(
      'flex items-center justify-between gap-3 border-b border-border py-2 pl-4 pr-2',
      isSticky && 'sticky top-0 z-10 bg-background',
    )}
  >
    <span className="min-w-0 truncate text-xs text-muted-foreground">
      {moduleCount} {getPlural(moduleCount, 'module')} · {itemCount} {getPlural(itemCount, 'item')}
    </span>
    <ExpandAllButton
      isAllExpanded={isAllOpen}
      onClick={onToggleAll}
      className="shrink-0 px-2.5 py-1 text-xs text-primary"
    />
  </div>
);

export const CourseOutline = ({ courseId, isPreview, isLocked, onSelectItem }: IProps) => {
  const { getCourseModules, isItemCompleted } = useCourse();
  const { isLoading } = useCourseLookups();
  const { getMaterialsByIds } = useMaterialLookups();
  const { getTestPapersByIds } = useTestPaperLookups();
  const { selectedCourseModuleId } = useSelectorLookups();
  const courseModules = getCourseModules(courseId);
  // Ids rather than positions, so a panel stays open if the module list arrives or reorders later.
  const { isExpanded, isAllExpanded, expand, setExpandedIds, toggleAll } = useExpandedIds(
    courseModules.map((courseModule) => courseModule._id),
  );

  // Every module starts folded; while learning, the one holding the current lesson opens itself,
  // so moving to the next lesson across a module boundary keeps it in view.
  useEffect(() => {
    if (isPreview || !selectedCourseModuleId) return;
    expand(selectedCourseModuleId);
  }, [isPreview, selectedCourseModuleId, expand]);

  if (!courseModules.length) {
    if (isLoading('courseModules')) return null;
    return (
      <BlankState label="No modules yet" description="Lessons and tests will appear here once they are published." />
    );
  }

  const openIndexes = courseModules.flatMap((courseModule, index) => (isExpanded(courseModule._id) ? [index] : []));
  const itemCount = courseModules.reduce(
    (count, courseModule) => count + (courseModule.materials?.length ?? 0) + (courseModule.testPapers?.length ?? 0),
    0,
  );

  return (
    <>
      <OutlineToolbar
        moduleCount={courseModules.length}
        itemCount={itemCount}
        isAllOpen={isAllExpanded}
        isSticky={!isPreview}
        onToggleAll={toggleAll}
      />
      <Accordion
        type="multiple"
        openIndexes={openIndexes}
        onOpenIndexesChange={(indexes) => setExpandedIds(indexes.map((index) => courseModules[index]._id))}
        contentClassName="px-0 pb-0"
        className="[&>div:last-child]:border-b-0 [&_button]:px-4 [&_button]:py-3"
        items={courseModules.map((courseModule, index) => {
          const items: ICourseModuleItem[] = [
            ...getMaterialsByIds(courseModule.materials ?? []).map((material) => ({
              courseId,
              courseModuleId: courseModule._id,
              material,
            })),
            ...getTestPapersByIds(courseModule.testPapers ?? []).map((testPaper) => ({
              courseId,
              courseModuleId: courseModule._id,
              testPaper,
            })),
          ];
          const completedCount = items.filter(isItemCompleted).length;
          return {
            id: courseModule._id,
            title: (
              <ModuleTitle
                courseModule={courseModule}
                index={index}
                itemCount={items.length}
                completedCount={completedCount}
                isOpen={isExpanded(courseModule._id)}
              />
            ),
            component: (
              <div>
                {isPreview && courseModule.description ? (
                  <p className="px-4 pb-2 pt-1 text-sm text-muted-foreground">{courseModule.description}</p>
                ) : null}
                <div className="flex flex-col">
                  {/* The divider sits on a wrapper, inset, so it neither recolours the selection bar nor spans the row. */}
                  {items.map((item) => (
                    <div
                      key={item.material?._id ?? item.testPaper?._id}
                      className="relative before:absolute before:inset-x-4 before:top-0 before:border-t before:border-dotted before:border-border"
                    >
                      <OutlineItem item={item} isPreview={isPreview} isLocked={isLocked} onSelect={onSelectItem} />
                    </div>
                  ))}
                </div>
              </div>
            ),
          };
        })}
      />
    </>
  );
};
