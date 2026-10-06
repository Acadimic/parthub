import { useCourse } from '@hooks/course.hook';
import { BookOpenTextIcon, ClipboardTextIcon } from '@phosphor-icons/react';
import { type CourseCommentDto } from '@repo/shared/contracts';

/**
 * The lesson or test paper the comment was written from, as a chip that opens it. Nothing shows
 * when the item is no longer in the course, or the comment was written with nothing open.
 */
export const CommentSource = ({ comment }: { comment: CourseCommentDto }) => {
  const { getCourseItems, selectItem } = useCourse();
  if (!comment.material && !comment.testPaper) return null;
  const item = getCourseItems(comment.course).find(
    ({ material, testPaper }) =>
      (comment.material && material?._id === comment.material) ||
      (comment.testPaper && testPaper?._id === comment.testPaper),
  );
  const name = item?.material?.name ?? item?.testPaper?.name;
  if (!item || !name) return null;
  const Icon = item.testPaper ? ClipboardTextIcon : BookOpenTextIcon;
  return (
    <button
      type="button"
      title={`Open ${name}`}
      onClick={() => selectItem(item)}
      className="mt-1 flex max-w-full items-center gap-1 self-start rounded-md bg-muted px-1.5 py-0.5 text-xxs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Icon weight="bold" className="h-3 w-3 shrink-0" />
      <span className="truncate">{name}</span>
    </button>
  );
};
