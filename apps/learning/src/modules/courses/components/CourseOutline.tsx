import { Accordion } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { BlankState } from '@components/others';
import { ModuleContentType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import { BookOpenTextIcon, CheckIcon, ClipboardTextIcon, LockSimpleIcon, VideoIcon } from '@phosphor-icons/react';
import { type ICourseModule, useCourseLookups, useMaterialLookups, useTestPaperLookups } from '@stores';
import { getPlural } from '@utils/helpers';

const ITEM_ICONS = {
  [ModuleContentType.VIDEO]: VideoIcon,
  [ModuleContentType.READING]: BookOpenTextIcon,
  [ModuleContentType.TEST_PAPER]: ClipboardTextIcon,
  [ModuleContentType.COMPLETED]: CheckIcon,
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
const getMarkClass = (isCompleted: boolean, isSelected: boolean) => {
  if (isCompleted) return 'h-6 w-6 bg-success/15 text-success';
  if (isSelected) return 'h-8 w-8 bg-primary text-primary-foreground';
  return 'h-8 w-8 bg-muted text-muted-foreground';
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
      {/* A fixed slot keeps the text column aligned whatever size the mark inside it is. */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        <span
          className={cn(
            'flex items-center justify-center rounded-full transition-colors',
            getMarkClass(isCompleted, isSelected),
          )}
        >
          <RowIcon weight="bold" className={isCompleted ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm', isSelected ? 'font-semibold' : 'font-medium')}>
          {details?.name}
        </span>
        <span className="block text-xs capitalize text-muted-foreground">
          {type} · {details?.durationMins ?? 0} min
        </span>
      </span>
    </button>
  );
};

/** One module's title, with its position and its own completion summary. */
const ModuleTitle = ({
  courseModule,
  index,
  itemCount,
  completedCount,
}: {
  courseModule: ICourseModule;
  index: number;
  itemCount: number;
  completedCount: number;
}) => {
  const isDone = itemCount > 0 && completedCount === itemCount;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold',
          isDone ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
        )}
      >
        {isDone ? <CheckIcon weight="bold" className="h-3.5 w-3.5" /> : index + 1}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{courseModule.name}</span>
        <span className="block text-xs font-normal text-muted-foreground">
          {itemCount ? `${completedCount} of ${itemCount} ${getPlural(itemCount, 'item')} done` : 'No items yet'}
        </span>
      </span>
    </span>
  );
};

export const CourseOutline = ({ courseId, isPreview, isLocked, onSelectItem }: IProps) => {
  const { getCourseModules, isItemCompleted } = useCourse();
  const { isLoading } = useCourseLookups();
  const { getMaterialsByIds } = useMaterialLookups();
  const { getTestPapersByIds } = useTestPaperLookups();
  const courseModules = getCourseModules(courseId);

  if (!courseModules.length) {
    if (isLoading('courseModules')) return null;
    return (
      <BlankState label="No modules yet" description="Lessons and tests will appear here once they are published." />
    );
  }

  return (
    <Accordion
      type="multiple"
      openIndexes={courseModules.map((_, index) => index)}
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
            />
          ),
          component: (
            <div className={cn('pb-2', isPreview && 'pb-4')}>
              {isPreview && courseModule.description ? (
                <p className="px-4 pb-2 pt-1 text-sm text-muted-foreground">{courseModule.description}</p>
              ) : null}
              <div className="flex flex-col">
                {items.map((item) => (
                  <OutlineItem
                    key={item.material?._id ?? item.testPaper?._id}
                    item={item}
                    isPreview={isPreview}
                    isLocked={isLocked}
                    onSelect={onSelectItem}
                  />
                ))}
              </div>
            </div>
          ),
        };
      })}
    />
  );
};
