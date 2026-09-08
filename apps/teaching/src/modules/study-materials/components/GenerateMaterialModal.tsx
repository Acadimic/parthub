import { UploadFiles } from '@components/app/attachments';
import { Label, Modal, ModalFooter, TextArea, TextInput } from '@repo/ui/app';
import { PositionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { MaterialService } from '@services';
import { useStores } from '@stores';
import { getGeneratedMaterialPrompt } from '@utils/ai/prompts';
import { errorToast, successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useSetState } from 'react-use';
import { CopyUrl } from '@components/common';
import { getTextWithEquationBlocksString } from '@components/editors/math-jax-editor/util';

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

const isYouTubeUrl = (url: string) => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/;
  return pattern.test(url);
};

const isYouTubeVideoValid = async (url: string) => {
  if (!isYouTubeUrl(url)) return false;

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    return response.ok; // true if video exists and is public
  } catch (err) {
    return false;
  }
};

export const GenerateMaterialModal = observer(({ isOpen, onClose }: IProps) => {
  const { selectorStore, materialStore, standardStore } = useStores();
  const { selectedMaterial, removeSelectedMaterialId } = selectorStore;
  const { getStandardById, getSubjectById, getChapterById } = standardStore;
  const { addLinkAttachment } = materialStore;
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

  const generateAndSaveQuestions = async () => {
    if (!selectedMaterial) return;
    setState({ isLoading: true });
    try {
      const text = state.materialText.replace(/\\/g, '\\\\');
      const materialContent = getTextWithEquationBlocksString(JSON.parse(text || '[]'));
      const videoLinks: IVideo[] = JSON.parse(state.youtubeVideos || '[]');
      selectedMaterial.setContent(materialContent);
      console.log('####materialContent: ', selectedMaterial.content);
      // if (materialContent) return;
      const attachments = await uploadFilesToS3(selectedMaterial._id, selectedFiles);
      attachments?.forEach((attachment) => selectedMaterial.addAttachment(attachment));
      for (const item of videoLinks) {
        const isValid = await isYouTubeVideoValid(item.url);
        if (!isValid) continue;
        const attachment = addLinkAttachment();
        attachment?.setFileName(item.title);
        attachment?.setUrl(item.url);
      }
      await MaterialService.upsertMaterial(selectedMaterial);
      setSelectedFiles([]);
      setState(initialState);
      if (selectedMaterial.isNew) selectedMaterial?.resetIsNew();
      successToast({ message: `Material generated successfully!` });
      setTimeout(() => {
        removeSelectedMaterialId();
        onClose();
      }, 500);
    } catch (error) {
      console.log(error);
      errorToast({ message: 'Invalid format.' });
    } finally {
      setState({ isLoading: false });
    }
  };

  const questionPrompt = selectedMaterial
    ? getGeneratedMaterialPrompt({
        topic: state.topic,
        chapterName: selectedMaterial?.chapter ? getChapterById(selectedMaterial.chapter)?.name : null,
        standardName: getStandardById(selectedMaterial.standard)?.name || '',
        subjectName: getSubjectById(selectedMaterial.subject)?.name || '',
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
      title={`Generate Questions`}
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
              <div className="line-clamp-6 text-color-secondary text-sm">{questionPrompt}</div>
              <div className="py-2">
                <CopyUrl url={questionPrompt} isCopyIconOnly />
              </div>
            </div>
          </div>
          <TextArea
            value={state.materialText}
            onChange={(e) => setState({ materialText: e.target.value })}
            label="Materials"
          />
          <TextArea
            value={state.youtubeVideos}
            onChange={(e) => setState({ youtubeVideos: e.target.value })}
            label="Video Links"
          />
          <div className="flex flex-col gap-3">
            <Label label="Attachments" required />
            <div className="flex justify-center border border-color-border py-2.5 px-3">
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
      footer={<ModalFooter onCancel={handleClose} onSave={generateAndSaveQuestions} isLoading={state.isLoading} />}
    />
  );
});
