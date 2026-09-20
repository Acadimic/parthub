import { useStandardStore } from '@stores';

interface IProps {
  chapterId?: string | null | undefined;
}

export const ChapterName = ({ chapterId }: IProps) => {
  // The one name: a whole-store subscription would re-render every content on the page.
  const name = useStandardStore((state) => (chapterId ? state.chapterMap[chapterId]?.name : null));

  return <div className="text-xs text-muted-foreground flex justify-end mt-1 italic truncate">{name}</div>;
};
