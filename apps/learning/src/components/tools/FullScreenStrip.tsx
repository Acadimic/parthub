import { useSelectedMaterial } from '@stores';
import { ReaderProgress } from './ReaderProgress';

/** The lesson's progress strip along the top of a full-screen viewer, when a lesson is on screen. */
export const FullScreenStrip = () => {
  const material = useSelectedMaterial();
  return material ? <ReaderProgress material={material} /> : null;
};
