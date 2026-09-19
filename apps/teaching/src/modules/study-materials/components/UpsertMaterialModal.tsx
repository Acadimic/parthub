import { RichTextEditor } from '@repo/ui/editor';
import { Attachments, UploadFiles } from '@components/app/attachments';
import { Select } from '@components/app/selects';
import { Button, Label, Modal, ModalFooter, SimpleAccordions, TextInput } from '@repo/ui/app';
import { PlusIcon } from '@phosphor-icons/react';
import { type AttachmentDto } from '@repo/shared/contracts';
import { PositionType } from '@enums';
import { type UploadProgress, useAttachment } from '@hooks/attachment.hook';
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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  // Uploaded attachments removed while editing. Their objects are deleted only once the save has
  // gone through, so a cancelled edit leaves the saved material's files where they were.
  const [removedAttachments, setRemovedAttachments] = useState<AttachmentDto[]>([]);
  const chapters = getStandardSubjectChapters(selectedStandardId, selectedSubjectId);
  const { uploadFilesToS3, deleteAttachments } = useAttachment();
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
    setRemovedAttachments([]);
    onClose();
  };

  const onRemoveAttachment = (attachment: AttachmentDto) => {
    if (!selectedMaterial) return;
    removeAttachment(selectedMaterial._id, attachment.key);
    if (attachment.isUploaded) setRemovedAttachments((current) => [...current, attachment]);
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
    // Uploaded here, before the record is written, and deleted again below if that write fails:
    // the bucket never holds a file that no saved material points at.
    let uploaded: AttachmentDto[] = [];
    try {
      setIsLoading(true);
      setUploadProgress({});
      uploaded = await uploadFilesToS3(selectedMaterial._id, selectedFiles, (index, percent) =>
        setUploadProgress((current) => ({ ...current, [index]: percent })),
      );
      uploaded.forEach((attachment) => addAttachment(selectedMaterial._id, attachment));
      // Read the row back rather than posting `selectedMaterial`: the store holds immutable rows, so
      // the copy captured during render carries neither the uploads just added nor an edit made
      // after it.
      const material = useMaterialStore.getState().getMaterialById(selectedMaterial._id);
      if (!material) return;
      const result = await MaterialService.upsertMaterial(material);
      setSelectedFiles([]);
      // Only now are the removed files gone for good: the record no longer refers to them.
      await deleteAttachments(removedAttachments);
      setRemovedAttachments([]);
      // The server's row, not a patched local one: it carries the timestamps and ownership fields
      // the list rolls up, and replacing the draft is what clears `isNew`.
      if (result?.data) addMaterials([result.data]);
      else patchMaterial(material._id, { isNew: false });
      successToast({ message: 'Content saved successfully!' });
      onClose();
    } catch (error) {
      uploaded.forEach((attachment) => removeAttachment(selectedMaterial._id, attachment.key));
      await deleteAttachments(uploaded);
      // `callAuthApi` has already toasted an HTTP failure, so toasting here would show it twice.
      // Anything thrown that is not an `Error` carries no message of its own.
      if (!(error instanceof Error)) errorToast({ message: 'Could not save the content.' });
    } finally {
      setIsLoading(false);
      setUploadProgress({});
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
                  <UploadFiles
                    selectedFiles={selectedFiles}
                    setSelectedFiles={(files) => setSelectedFiles([...selectedFiles, ...files].slice(0, 5))}
                    removeFile={removeFile}
                    progress={isLoading ? uploadProgress : undefined}
                    isUploading={isLoading}
                    isPdf
                    maxFiles={5}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Attachments
                      attachments={selectedMaterial.attachments ?? []}
                      onRemove={onRemoveAttachment}
                      onEdit={(attachment) => onEditAttachment(attachment.key)}
                      className="contents"
                    />
                    <Button
                      text="Add link"
                      leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
                      onClick={onAddLinkAttachment}
                      isSubtle
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
                                <StudyMaterialView material={selectedMaterial} />
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
