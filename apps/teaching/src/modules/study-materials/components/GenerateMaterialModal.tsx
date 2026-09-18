import { richTextFromMarkdown } from '@repo/shared/utils';
import { UploadFiles } from '@components/app/attachments';
import { Label, Modal, ModalFooter, TextArea, TextInput } from '@repo/ui/app';
import { PositionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { MaterialService } from '@services';
import {
  useStandardLookups,
  useMaterialLookups,
  useMaterialStore,
  useSelectedMaterial,
  useSelectorLookups,
} from '@stores';
import { getGeneratedMaterialPrompt } from '@utils/ai/prompts';
import { errorToast, successToast } from '@utils/helpers';
import { useEffect, useState } from 'react';
import { useSetState } from 'react-use';
import { CopyUrl } from '@components/common';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IState {
  topic: string;
  isLoading: boolean;
  prompt: string;
  materialText: string;
  youtubeVideos: string;
}

interface IVideo {
  title: string;
  url: string;
}

/**
 * The video field, or `null` when it is not JSON.
 *
 * Parsed on its own so a malformed list is the only thing that reports "Invalid format." — the
 * whole save used to sit in one `try`, so a failed upload or a rejected upsert blamed the user's
 * formatting.
 */
const parseVideoLinks = (value: string): IVideo[] | null => {
  if (!value.trim()) return [];
  try {
    return JSON.parse(value) as IVideo[];
  } catch {
    return null;
  }
};

const isYouTubeUrl = (url: string) => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/;
  return pattern.test(url);
};

const isYouTubeVideoValid = async (url: string) => {
  if (!isYouTubeUrl(url)) return false;

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    return response.ok; // true if video exists and is public
  } catch {
    return false;
  }
};

export const GenerateMaterialModal = ({ isOpen, onClose }: IProps) => {
  const selectorStore = useSelectorLookups();
  const materialStore = useMaterialLookups();
  const { patchMaterial, addMaterials } = materialStore;
  const { addAttachment } = materialStore;
  const { removeSelectedMaterialId } = selectorStore;
  const selectedMaterial = useSelectedMaterial();
  const { getStandardById, getSubjectById, getChapterById } = useStandardLookups();
  const { addLinkAttachment, patchAttachment } = materialStore;
  const { uploadFilesToS3 } = useAttachment();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const initialState = {
    topic: selectedMaterial?.name || '',
    isLoading: false,
    prompt: '',
    materialText: '',
    youtubeVideos: '',
  };

  const [state, setState] = useSetState<IState>(initialState);

  const removeFile = (index: number) => {
    const files = [...selectedFiles];
    files.splice(index, 1);
    setSelectedFiles(files);
  };

  const handleClose = () => {
    if (state.isLoading) return;
    onClose();
  };

  const generateAndSaveMaterial = async () => {
    if (!selectedMaterial) return;
    const videoLinks = parseVideoLinks(state.youtubeVideos);
    if (!videoLinks) {
      errorToast({ message: 'Invalid format.' });
      return;
    }
    setState({ isLoading: true });
    try {
      // The model now returns Markdown, so the text is the content — no JSON parse, and no
      // backslash pre-escaping to survive one.
      patchMaterial(selectedMaterial._id, { content: richTextFromMarkdown(state.materialText) });
      const attachments = (await uploadFilesToS3(selectedMaterial._id, selectedFiles)) ?? [];
      attachments.forEach((attachment) => addAttachment(selectedMaterial._id, attachment));
      for (const item of videoLinks) {
        const isValid = await isYouTubeVideoValid(item.url);
        if (!isValid) continue;
        const attachment = addLinkAttachment(selectedMaterial._id);
        patchAttachment(selectedMaterial._id, attachment.key, { fileName: item.title, url: item.url });
      }
      // Read the row back rather than posting `selectedMaterial`: the store holds immutable rows, so
      // the copy captured during render carries none of the patches above.
      const material = useMaterialStore.getState().getMaterialById(selectedMaterial._id);
      if (!material) return;
      const result = await MaterialService.upsertMaterial(material);
      setSelectedFiles([]);
      setState(initialState);
      // The server's row, not a patched local one: it carries the timestamps the list rolls up, and
      // replacing the draft is what clears `isNew`.
      if (result?.data) addMaterials([result.data]);
      else patchMaterial(material._id, { isNew: false });
      successToast({ message: `Material generated successfully!` });
      removeSelectedMaterialId();
      onClose();
    } catch (error) {
      // `callAuthApi` has already toasted an HTTP failure, so toasting here would show it twice.
      // Anything thrown that is not an `Error` carries no message of its own.
      if (!(error instanceof Error)) errorToast({ message: 'Could not generate the material.' });
    } finally {
      setState({ isLoading: false });
    }
  };

  const questionPrompt = selectedMaterial
    ? getGeneratedMaterialPrompt({
        topic: state.topic,
        chapterName: selectedMaterial?.chapter ? getChapterById(selectedMaterial.chapter)?.name : null,
        standardName: (selectedMaterial.standard ? getStandardById(selectedMaterial.standard)?.name : '') || '',
        subjectName: (selectedMaterial.subject ? getSubjectById(selectedMaterial.subject)?.name : '') || '',
        prompt: state.prompt,
      })
    : '';

  useEffect(() => {
    setState({ topic: selectedMaterial?.name || '' });
  }, [selectedMaterial?._id]);

  return (
    <Modal
      position={PositionType.RIGHT}
      className="min-w-full md:min-w-[60%] lg:min-w-[60%] md:max-w-[60%] lg:max-w-[60%]"
      title="Generate Material"
      isOpen={isOpen}
      onClose={handleClose}
      component={
        <div className="flex flex-col gap-4">
          <TextInput
            type="text"
            value={state.topic}
            onChange={(e) => setState({ topic: e.target.value })}
            label="Topic"
            required
          />
          <TextInput
            type="text"
            value={state.prompt}
            onChange={(e) => setState({ prompt: e.target.value })}
            label="Additional Prompt"
            required
          />
          <div>
            <Label label="Topic Prompt" required />
            <div className="flex items-start justify-between gap-2">
              <div className="line-clamp-6 text-muted-foreground text-sm">{questionPrompt}</div>
              <div className="py-2">
                <CopyUrl url={questionPrompt} isCopyIconOnly />
              </div>
            </div>
          </div>
          <TextArea
            value={state.materialText}
            onChange={(e) => setState({ materialText: e.target.value })}
            label="Materials (Markdown)"
          />
          <TextArea
            value={state.youtubeVideos}
            onChange={(e) => setState({ youtubeVideos: e.target.value })}
            label="Video Links"
          />
          <div className="flex flex-col gap-3">
            <Label label="Attachments" required />
            <div className="flex justify-center border border-border py-2.5 px-3">
              <div className="w-full cursor-pointer">
                <UploadFiles
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  removeFile={removeFile}
                  isPdf
                  maxFiles={5}
                />
              </div>
            </div>
          </div>
        </div>
      }
      footer={<ModalFooter onCancel={handleClose} onSave={generateAndSaveMaterial} isLoading={state.isLoading} />}
    />
  );
};
