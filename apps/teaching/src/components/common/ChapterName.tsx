import { useStandardLookups } from '@stores';

interface IProps {
  chapterId?: string | null | undefined;
}

export const ChapterName = ({ chapterId }: IProps) => {
  const { getChapterById } = useStandardLookups();

  return (
    <div className="text-xs text-muted-foreground flex justify-end mt-1 italic truncate">
      {chapterId ? getChapterById(chapterId)?.name : null}
    </div>
  );
};
