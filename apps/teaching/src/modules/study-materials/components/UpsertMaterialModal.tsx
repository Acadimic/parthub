import { Attachments, UploadFiles } from '@components/app/attachments';
import { Select } from '@components/app/selects';
import { Button, Label, Modal, ModalFooter, SimpleAccordions, TextInput } from '@repo/ui/app';
import { PlusIcon } from '@phosphor-icons/react';
import { type FileExtension, PositionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { type ISelectItem } from '@interfaces';
import { AddChapterButton } from '@modules/chapters/components/AddChapterButton';
import { MaterialService } from '@services';
import {
  type IAttachment,
  useStandardLookups,
  useMaterialLookups,
  useSelectedMaterial,
  useSelectorLookups,
} from '@stores';
import { successToast } from '@utils/helpers';
import { useState } from 'react';
import { StudyMaterialView } from './StudyMaterialView';
import { UpsertAttachmentModal } from './UpsertAttachment';
import { type Block, MathEditor } from '@components/editors';
import { getBlocks } from '@components/editors/math-jax-editor/util';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertMaterialModal = ({ isOpen, onClose }: IProps) => {
  const selectorStore = useSelectorLookups();
  const materialStore = useMaterialLookups();
  const { renameMaterial } = materialStore;
  const { removeAttachment } = materialStore;
  const { patchMaterial } = materialStore;
  const { addAttachment } = materialStore;
  const { selectedStandardId, selectedSubjectId } = selectorStore;
  const selectedMaterial = useSelectedMaterial();
  const { addLinkAttachment } = materialStore;
  const { getStandardSubjectChapters } = useStandardLookups();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const chapters = getStandardSubjectChapters(selectedStandardId, selectedSubjectId);
  const { uploadFilesToS3 } = useAttachment();
  const [selectedAttachment, setSelectedAttachment] = useState<IAttachment | null>(null);

  const onAddLinkAttachment = () => {
    if (!selectedMaterial) return;
    setSelectedAttachment(addLinkAttachment(selectedMaterial._id));
  };

  const onEditAttachment = (attachment: IAttachment) => {
    setSelectedAttachment(attachment);
  };

  const onCloseAttachmentModal = () => {
    // A draft link the user abandoned without filling in is not worth keeping.
    if (selectedMaterial && selectedAttachment?.isNew && (!selectedAttachment.fileName || !selectedAttachment.url)) {
      removeAttachment(selectedMaterial._id, selectedAttachment._id);
    }
    setSelectedAttachment(null);
  };

  const handleClose = () => {
    if (isLoading) return;
    setSelectedFiles([]);
    onClose();
  };

  const removeFile = (index: number) => {
    const files = [...selectedFiles];
    files.splice(index, 1);
    setSelectedFiles(files);
  };

  const handleChapterChange = (values: ISelectItem[]) => {
    if (!values.length || !selectedMaterial) return;
    patchMaterial(selectedMaterial._id, { chapter: values[0].value });
  };

  const handleContentTextChange = (blocks: Block[]) => {
    if (!selectedMaterial) return;
    patchMaterial(selectedMaterial._id, { content: JSON.stringify(blocks) });
  };

  // Upload files to S3 bucket

  const saveMaterial = async () => {
    if (!selectedMaterial) return;
    try {
      setIsLoading(true);
      const attachments = await uploadFilesToS3(selectedMaterial._id, selectedFiles);
      attachments?.forEach((attachment) => addAttachment(selectedMaterial._id, attachment));
      await MaterialService.upsertMaterial(selectedMaterial);
      setSelectedFiles([]);
      patchMaterial(selectedMaterial._id, { isNew: false });
      successToast({ message: 'Content saved successfully!' });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title={`${selectedMaterial?.isNew ? 'Add' : 'Update'} Material`}
        isOpen={isOpen}
        onClose={handleClose}
        component={
          selectedMaterial && (
            <div>
              <div className="flex flex-col gap-4">
                <TextInput
                  label="Content Title"
                  required
                  value={selectedMaterial.name}
                  onChange={(e) => renameMaterial(selectedMaterial._id, e.target.value)}
                />
                <div>
                  <div className="max-w-full">
                    <MathEditor
                      label="Content"
                      handleChange={handleContentTextChange}
                      blocks={getBlocks(selectedMaterial.content ?? '')}
                    />
                  </div>
                </div>
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
                  <div>
                    <Button
                      text="Add Link"
                      leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
                      onClick={onAddLinkAttachment}
                      isSubtle
                    />
                  </div>
                  <div>
                    <Attachments
                      attachments={(selectedMaterial.attachments ?? []).map((attachment, index) => ({
                        fileName: attachment.fileName,
                        extension: attachment.fileExtension,
                        index,
                        onRemove: () => removeAttachment(selectedMaterial._id, attachment._id),
                        onEdit: () => onEditAttachment(attachment),
                        url: attachment.url,
                        isStatic: attachment.isUploaded ? false : true,
                      }))}
                    />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-full flex-1">
                    <Select
                      label="Assign Chapter"
                      items={[...chapters.map((chapter) => ({ label: chapter.name, value: chapter._id }))]}
                      values={selectedMaterial.chapter ? [selectedMaterial.chapter] : []}
                      onChange={handleChapterChange}
                      isSingleSelect
                      required
                      notFoundComponent={<AddChapterButton standard={selectedStandardId} subject={selectedSubjectId} />}
                    />
                  </div>
                  <div className="pb-[1px]">
                    <AddChapterButton standard={selectedStandardId} subject={selectedSubjectId} />
                  </div>
                </div>
                {selectedMaterial.content || (selectedMaterial.attachments ?? []).length ? (
                  <div className="mt-12 flex flex-col gap-2 items-center justify-center">
                    <SimpleAccordions
                      items={[
                        {
                          title: <Label label="Content Preview" required />,
                          component: (
                            <div className="w-full">
                              <div className="border border-border py-2 px-2 w-full flex flex-col gap-2">
                                <StudyMaterialView
                                  material={selectedMaterial}
                                  otherAttachments={selectedFiles.map((file, index) => ({
                                    fileName: file.name,
                                    extension: file.name.split('.').pop() as FileExtension,
                                    index,
                                    url: URL.createObjectURL(file),
                                    isStatic: true,
                                  }))}
                                />
                              </div>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )
        }
        footer={<ModalFooter onCancel={handleClose} onSave={saveMaterial} isLoading={isLoading} />}
      />
      <UpsertAttachmentModal
        selectedAttachment={selectedAttachment}
        isOpen={!!selectedAttachment}
        onClose={onCloseAttachmentModal}
      />
    </>
  );
};
