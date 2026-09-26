import { type BookmarkDto } from '@repo/shared/contracts';
import { type IRichText } from '@repo/shared/interfaces';
import { Button, Link } from '@repo/ui/app';
import { Chip } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { BlankState } from '@components/others';
import { CollectionType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { type ISavedItem, type SavedItemKind } from '@interfaces';
import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  BookOpenTextIcon,
  ClipboardTextIcon,
  QuestionIcon,
} from '@phosphor-icons/react';
import {
  useCourseLookups,
  useMaterialLookups,
  useQuestionLookups,
  useResourceLookups,
  useTestPaperLookups,
} from '@stores';
import { getPlural, getStringFormattedDate } from '@utils/helpers';
import { useState } from 'react';

type Filter = SavedItemKind | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'lesson', label: 'Lessons' },
  { value: 'test', label: 'Tests' },
  { value: 'question', label: 'Questions' },
];

const KIND_LABEL: Record<SavedItemKind, string> = { lesson: 'Lesson', test: 'Test paper', question: 'Question' };

const KIND_ICON = {
  lesson: BookOpenTextIcon,
  test: ClipboardTextIcon,
  question: QuestionIcon,
};

const KIND_BY_REF: Partial<Record<CollectionType, SavedItemKind>> = {
  [CollectionType.MATERIAL]: 'lesson',
  [CollectionType.TEST_PAPER]: 'test',
  [CollectionType.QUESTION]: 'question',
};

/** How much of a question to show as its title. */
const PREVIEW_LENGTH = 120;

/** The text of a rich-text document, run together, for a question that has no name of its own. */
const getPlainText = (doc: IRichText | undefined): string => {
  const walk = (node: { text?: string; content?: unknown[] } | undefined): string => {
    if (!node) return '';
    if (typeof node.text === 'string') return node.text;
    return (node.content ?? []).map((child) => walk(child as { text?: string; content?: unknown[] })).join(' ');
  };
  return walk(doc).replace(/\s+/g, ' ').trim();
};

const truncate = (text: string) => (text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH - 1)}…` : text);

/** The bookmarks the learner still has, resolved against whatever the stores hold. */
const useSavedItems = (): { items: ISavedItem[]; rows: Record<string, BookmarkDto> } => {
  const { getBookmarks } = useResourceLookups();
  const { getCourseById } = useCourseLookups();
  const { getMaterialById } = useMaterialLookups();
  const { getTestPaperById } = useTestPaperLookups();
  const { getQuestionById } = useQuestionLookups();

  const rows: Record<string, BookmarkDto> = {};
  const items = getBookmarks()
    .filter((bookmark) => !bookmark._deleted && bookmark.course)
    .flatMap((bookmark) => {
      const kind = KIND_BY_REF[bookmark.collectionRef];
      const course = bookmark.course ? getCourseById(bookmark.course) : undefined;
      if (!kind || !course) return [];
      rows[bookmark._id] = bookmark;
      const title = (() => {
        if (kind === 'lesson') return getMaterialById(bookmark.collectionItem)?.name ?? 'A lesson';
        if (kind === 'test') return getTestPaperById(bookmark.collectionItem)?.name ?? 'A test paper';
        const preview = getPlainText(getQuestionById(bookmark.collectionItem)?.body);
        return preview ? truncate(preview) : 'A question';
      })();
      const item: ISavedItem = {
        id: bookmark._id,
        kind,
        title,
        courseId: course._id,
        courseName: course.name,
        savedAt: bookmark.createdAt ?? '',
        collectionItem: bookmark.collectionItem,
      };
      return [item];
    })
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return { items, rows };
};

const SavedCard = ({ item, onRemove, onOpen }: { item: ISavedItem; onRemove: () => void; onOpen: () => void }) => {
  const KindIcon = KIND_ICON[item.kind];
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          item.kind === 'question' ? 'bg-warning/15 text-warning' : 'bg-primary/10 text-primary',
        )}
      >
        <KindIcon weight="bold" className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">
          {KIND_LABEL[item.kind]}
          {item.savedAt ? ` · saved ${getStringFormattedDate(item.savedAt)}` : ''}
        </div>
        <div className={cn('text-sm font-semibold', item.kind === 'question' ? 'line-clamp-2' : 'truncate')}>
          {item.title}
        </div>
        <div className="mt-2 flex items-center gap-1">
          <Button
            isSubtle
            className="px-2 py-1 text-xs text-primary"
            onClick={onOpen}
            rightsection={<ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />}
          >
            Open
          </Button>
          <Button
            isSubtle
            aria-label="Remove bookmark"
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onRemove}
            leftsection={<BookmarkSimpleIcon weight="fill" className="h-3.5 w-3.5 text-warning" />}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
};

/**
 * Everything the learner has bookmarked, grouped by course. A lesson or test opens in place in the
 * learning view; a question opens its course, since the paper it sits in is only known once that
 * paper is loaded.
 */
export const SavedItems = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const { items, rows } = useSavedItems();
  const { removeBookmark } = useResourceLookups();
  const { getCourseItems, openItem, openCourse } = useCourse();

  const visible = filter === 'all' ? items : items.filter((item) => item.kind === filter);
  const byCourse = visible.reduce<{ courseId: string; courseName: string; items: ISavedItem[] }[]>((groups, item) => {
    const group = groups.find((entry) => entry.courseId === item.courseId);
    if (group) group.items.push(item);
    else groups.push({ courseId: item.courseId, courseName: item.courseName, items: [item] });
    return groups;
  }, []);

  const open = (item: ISavedItem) => {
    const courseItem = getCourseItems(item.courseId).find(
      (entry) => (entry.material?._id ?? entry.testPaper?._id) === item.collectionItem,
    );
    if (courseItem) openItem(courseItem);
    else openCourse(item.courseId);
  };

  const counts = FILTERS.map((option) => ({
    ...option,
    count: option.value === 'all' ? items.length : items.filter((item) => item.kind === option.value).length,
  }));

  if (!items.length) {
    return (
      <BlankState
        className="py-16"
        label="Nothing saved yet"
        description="Use the bookmark on a lesson, a test paper or a question to keep it here for later."
        action={
          <Link href="/courses" isSecondary>
            Browse courses
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {counts.map((option) => (
          <Chip
            key={option.value}
            label={`${option.label} · ${option.count}`}
            isSelected={filter === option.value}
            disabled={!option.count}
            onClick={() => setFilter(option.value)}
          />
        ))}
      </div>
      {byCourse.length === 0 ? (
        <BlankState label="Nothing of this kind saved" description="Pick another filter to see the rest." />
      ) : (
        byCourse.map((group) => (
          <section key={group.courseId} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="truncate text-sm font-semibold">{group.courseName}</h3>
              <span className="shrink-0 text-xs text-muted-foreground">
                {group.items.length} {getPlural(group.items.length, 'item')}
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {group.items.map((item) => (
                <SavedCard
                  key={item.id}
                  item={item}
                  onOpen={() => open(item)}
                  onRemove={() => removeBookmark(rows[item.id])}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
};
