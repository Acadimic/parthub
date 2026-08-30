import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  chapterId?: string | null | undefined;
}

export const ChapterName = observer(({ chapterId }: IProps) => {
  const { standardStore } = useStores();
  const { getChapterById } = standardStore;

  return (
    <div className="text-xs text-color-secondary flex justify-end mt-1 italic truncate">
      {chapterId ? getChapterById(chapterId)?.name : null}
    </div>
  );
});
