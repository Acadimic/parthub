import { RichTextEditor } from '@repo/ui/editor';
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
  useStandardLookups,
  useMaterialLookups,
  useMaterialStore,
  useSelectedMaterial,
  useSelectorLookups,
} from '@stores';
import { errorToast, successToast, validateFieldValues } from '@utils/helpers';
import { useState } from 'react';
import { StudyMaterialView } from './StudyMaterialView';
import { UpsertAttachmentModal } from './UpsertAttachment';

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
  const { addLinkAttachment, addMaterials } = materialStore;
  const { getStandardSubjectChapters } = useStandardLookups();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const chapters = getStandardSubjectChapters(selectedStandardId, selectedSubjectId);
  const { uploadFilesToS3 } = useAttachment();
  // The key of the attachment being edited, not a copy of it: a copy goes stale the moment it is
  // patched, so the row is read back out of the material on every render.
  const [selectedAttachmentKey, setSelectedAttachmentKey] = useState<string | null>(null);
  const selectedAttachment =
    (selectedMaterial?.attachments ?? []).find((attachment) => attachment.key === selectedAttachmentKey) ?? null;

  const onAddLinkAttachment = () => {
    if (!selectedMaterial) return;
    setSelectedAttachmentKey(addLinkAttachment(selectedMaterial._id).key);
  };

  const onEditAttachment = (key: string) => {
    setSelectedAttachmentKey(key);
  };

  const onCloseAttachmentModal = () => {
    // A draft link the user abandoned without filling in is not worth keeping.
    if (selectedMaterial && selectedAttachment && (!selectedAttachment.fileName || !selectedAttachment.url)) {
      removeAttachment(selectedMaterial._id, selectedAttachment.key);
    }
    setSelectedAttachmentKey(null);
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

  const saveMaterial = async () => {
    if (!selectedMaterial) return;
    // The title is trimmed for the check so a row of spaces does not count as a name; the stored
    // value is left as typed, because renaming happens as the user types.
    const errors = validateFieldValues(
      { title: selectedMaterial.name.trim(), chapter: selectedMaterial.chapter ?? '' },
      ['title', 'chapter'],
    );
    if (errors.length) return;
    try {
      setIsLoading(true);
      const attachments = (await uploadFilesToS3(selectedMaterial._id, selectedFiles)) ?? [];
      attachments.forEach((attachment) => addAttachment(selectedMaterial._id, attachment));
      // Read the row back rather than posting `selectedMaterial`: the store holds immutable rows, so
      // the copy captured during render carries neither the uploads just added nor an edit made
      // after it.
      const material = useMaterialStore.getState().getMaterialById(selectedMaterial._id);
      if (!material) return;
      const result = await MaterialService.upsertMaterial(material);
      setSelectedFiles([]);
      // The server's row, not a patched local one: it carries the timestamps and ownership fields
      // the list rolls up, and replacing the draft is what clears `isNew`.
      if (result?.data) addMaterials([result.data]);
      else patchMaterial(material._id, { isNew: false });
      successToast({ message: 'Content saved successfully!' });
      onClose();
    } catch (error) {
      // `callAuthApi` has already toasted an HTTP failure, so toasting here would show it twice.
      // Anything thrown that is not an `Error` carries no message of its own.
      if (!(error instanceof Error)) errorToast({ message: 'Could not save the content.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title={`${selectedMaterial?.isNew ? 'Add' : 'Update'} Material`}
        description="Title, content and attachments the learner will see."
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
                    <RichTextEditor
                      // Keyed by the row: without it the editor keeps its own document across a
                      // switch of material, and the next one opens showing the previous one's text.
                      key={selectedMaterial._id}
                      label="Content"
                      value={selectedMaterial.content}
                      onChange={(content) => patchMaterial(selectedMaterial._id, { content })}
                      editorClassName="min-h-[18rem]"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label label="Attachments" />
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
                        onRemove: () => removeAttachment(selectedMaterial._id, attachment.key),
                        onEdit: () => onEditAttachment(attachment.key),
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
                      notFoundComponent={
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No chapters yet — add one with the button beside this field.
                        </div>
                      }
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
                          title: <Label label="Content Preview" />,
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
