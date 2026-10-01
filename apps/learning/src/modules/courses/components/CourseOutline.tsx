import { ExpandAllButton } from '@repo/ui/app';
import { Accordion, Tabs } from '@repo/ui/core';
import { useExpandedIds } from '@repo/ui/hooks';
import { cn } from '@repo/ui/lib';
import { CONTENT_TYPE_ICONS, CONTENT_TYPE_TONES, ContentTypeBadge } from '@components/app/badges';
import { BlankState } from '@components/others';
import { ModuleContentType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import { CheckIcon, ClipboardTextIcon, ListBulletsIcon, LockSimpleIcon } from '@phosphor-icons/react';
import {
  type ICourseModule,
  useCourseLookups,
  useMaterialLookups,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { getPlural } from '@utils/helpers';
import { useEffect } from 'react';

interface IProps {
  courseId: string;
  /** Wider spacing and module descriptions; the learning view keeps it dense and adds the tests tab. */
  isPreview: boolean;
  /** A priced course without a seat: rows show a lock instead of their kind, and do not open. */
  isLocked: boolean;
  onSelectItem: (item: ICourseModuleItem) => void;
}

interface IListProps extends IProps {
  courseModules: ICourseModule[];
}

interface IRowProps {
  item: ICourseModuleItem;
  isPreview: boolean;
  isLocked: boolean;
  onSelect: (item: ICourseModuleItem) => void;
  /** Named only in the flat tests list, where a row has no module panel above it to say where it is. */
  moduleName?: string;
}

/** The mark's fill: done is a quiet tinted tick, so a finished list does not shout; selected beats idle. */
const getMarkClass = (type: ModuleContentType, isCompleted: boolean, isSelected: boolean, isLocked: boolean) => {
  if (isCompleted) return 'bg-success/15 text-success';
  if (isLocked) return 'bg-muted text-muted-foreground';
  return isSelected ? CONTENT_TYPE_TONES[type].solid : CONTENT_TYPE_TONES[type].soft;
};

const OutlineItem = ({ item, isPreview, isLocked, onSelect, moduleName }: IRowProps) => {
  const { getModuleContentType, isItemCompleted, isItemSelected } = useCourse();
  const type = getModuleContentType(item.material, item.testPaper);
  const isCompleted = isItemCompleted(item);
  const isSelected = !isPreview && isItemSelected(item);
  const details = item.material ?? item.testPaper;
  const RowIcon = isLocked ? LockSimpleIcon : CONTENT_TYPE_ICONS[isCompleted ? ModuleContentType.COMPLETED : type];

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
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xxs text-muted-foreground/70">
          <ContentTypeBadge type={type} size="xs" />
          <span aria-hidden className="h-[3px] w-[3px] shrink-0 rounded-full bg-muted-foreground/50" />
          <span className="shrink-0">{details?.durationMins ?? 0} min</span>
          {moduleName ? (
            <>
              <span aria-hidden className="h-[3px] w-[3px] shrink-0 rounded-full bg-muted-foreground/50" />
              <span className="truncate">{moduleName}</span>
            </>
          ) : null}
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

/** The line above a list: what it holds, and any control over the whole of it. Sticks while learning. */
const ListToolbar = ({
  summary,
  isSticky,
  action,
}: {
  summary: string;
  isSticky: boolean;
  action?: React.ReactNode;
}) => (
  <div
    className={cn(
      'flex min-h-[2.5rem] items-center justify-between gap-3 border-b border-border py-2 pl-4 pr-2',
      isSticky && 'sticky top-0 z-10 bg-background',
    )}
  >
    <span className="min-w-0 truncate text-xs text-muted-foreground">{summary}</span>
    {action}
  </div>
);

/** The syllabus: one folding panel per module, with its lessons and tests inside. */
const ModuleList = ({ courseId, courseModules, isPreview, isLocked, onSelectItem }: IListProps) => {
  const { isItemCompleted } = useCourse();
  const { getMaterialsByIds } = useMaterialLookups();
  const { getTestPapersByIds } = useTestPaperLookups();
  const { selectedCourseModuleId } = useSelectorLookups();
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

  const openIndexes = courseModules.flatMap((courseModule, index) => (isExpanded(courseModule._id) ? [index] : []));
  const itemCount = courseModules.reduce(
    (count, courseModule) => count + (courseModule.materials?.length ?? 0) + (courseModule.testPapers?.length ?? 0),
    0,
  );

  return (
    <>
      <ListToolbar
        summary={`${courseModules.length} ${getPlural(courseModules.length, 'module')} · ${itemCount} ${getPlural(itemCount, 'item')}`}
        isSticky={!isPreview}
        action={
          <ExpandAllButton
            isAllExpanded={isAllExpanded}
            onClick={toggleAll}
            className="shrink-0 px-2.5 py-1 text-xs text-primary"
          />
        }
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

/** Every test paper in the course in one flat list, for a learner who only wants to practise. */
const TestList = ({ courseId, courseModules, isLocked, onSelectItem }: IListProps) => {
  const { getCourseItems, isItemCompleted } = useCourse();
  const tests = getCourseItems(courseId).filter((item) => item.testPaper);
  const completedCount = tests.filter(isItemCompleted).length;
  const getModuleName = (courseModuleId: string) =>
    courseModules.find((courseModule) => courseModule._id === courseModuleId)?.name;

  if (!tests.length) {
    return (
      <BlankState
        label="No tests yet"
        description="Tests will appear here once your teacher adds them to the course."
      />
    );
  }

  return (
    <>
      <ListToolbar summary={`${tests.length} ${getPlural(tests.length, 'test')} · ${completedCount} done`} isSticky />
      <div className="flex flex-col">
        {tests.map((item) => (
          <div
            key={item.testPaper?._id}
            className="relative before:absolute before:inset-x-4 before:top-0 before:border-t before:border-dotted before:border-border first:before:border-0"
          >
            <OutlineItem
              item={item}
              isPreview={false}
              isLocked={isLocked}
              onSelect={onSelectItem}
              moduleName={getModuleName(item.courseModuleId)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export const CourseOutline = (props: IProps) => {
  const { courseId, isPreview } = props;
  const { getCourseModules } = useCourse();
  const { isLoading } = useCourseLookups();
  const courseModules = getCourseModules(courseId);

  if (!courseModules.length) {
    if (isLoading('courseModules')) return null;
    return (
      <BlankState label="No modules yet" description="Lessons and tests will appear here once they are published." />
    );
  }

  if (isPreview) return <ModuleList {...props} courseModules={courseModules} />;

  // The strip stays put and each panel scrolls under it, so the tabs are always one tap away. The
  // caller gives the outline a column to fill; see `CourseModules`.
  return (
    <Tabs
      className="flex min-h-0 flex-1 flex-col"
      contentClassName="mt-0 min-h-0 flex-1 overflow-y-auto"
      triggerClassName="px-3 py-1.5 text-xs"
      tabs={[
        {
          label: 'Contents',
          icon: <ListBulletsIcon weight="bold" className="h-3.5 w-3.5" />,
          component: <ModuleList {...props} courseModules={courseModules} />,
        },
        {
          label: 'Tests',
          icon: <ClipboardTextIcon weight="bold" className="h-3.5 w-3.5" />,
          component: <TestList {...props} courseModules={courseModules} />,
        },
      ]}
    />
  );
};
