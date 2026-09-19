import { UploadAvatar } from '@components/app/attachments';
import { Label, Modal, ModalFooter, TextArea, TextInput } from '@repo/ui/app';
import { PositionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { SubjectService } from '@services';
import { useSelectedSubject, useSelectorStore, useStandardStore } from '@stores';
import { successToast } from '@utils/helpers';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertSubjectModal = ({ isOpen, onClose }: IProps) => {
  const selectedSubject = useSelectedSubject();
  const renameSubject = useStandardStore((state) => state.renameSubject);
  const patchSubject = useStandardStore((state) => state.patchSubject);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadFilesToS3 } = useAttachment();
  const [selectedFile, setSelectedFile] = useState<File>();

  const closeModal = async () => {
    const subjectId = useSelectorStore.getState().selectedSubjectId;
    const store = useStandardStore.getState();
    const subject = store.getSubjectById(subjectId);
    if (!subject) return;
    if (subject.isNew) store.removeSubject(subjectId);
    else await store.loadSubjects();
    useSelectorStore.getState().setSelectedSubjectId('');
    setSelectedFile(undefined);
    onClose();
  };

  const saveSubject = async () => {
    const subjectId = selectedSubject?._id;
    if (!subjectId) return;
    try {
      setIsLoading(true);
      if (selectedFile) {
        const attachments = await uploadFilesToS3(subjectId, [selectedFile]);
        if (attachments.length) patchSubject(subjectId, { logo: attachments[0].url });
      }
      // Read the row back rather than posting `selectedSubject`: the store holds immutable rows, so
      // the copy captured during render does not carry the logo patch above.
      const store = useStandardStore.getState();
      const subject = store.getSubjectById(subjectId);
      if (!subject) return;
      await SubjectService.upsertSubject(subject);
      store.patchSubject(subjectId, { isNew: false });
      successToast({ message: 'Subject added successfully.' });
      closeModal();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = () => {
    if (!selectedSubject) return;
    patchSubject(selectedSubject._id, { logo: null });
    setSelectedFile(undefined);
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      title={`${!selectedSubject?.isNew ? 'Update' : 'Create'} Subject`}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={closeModal}
      component={
        selectedSubject && (
          <div className="flex flex-col space-y-3">
            <div>
              <div>
                <Label label="Subject Logo" required />
                <div className="flex justify-center mt-1">
                  <div className="w-full">
                    <UploadAvatar
                      url={selectedSubject.logo}
                      file={selectedFile}
                      setFile={setSelectedFile}
                      removeFile={removeLogo}
                    />
                  </div>
                </div>
              </div>
              <TextInput
                label="Subject Name"
                value={selectedSubject.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  renameSubject(selectedSubject._id, e.target.value)
                }
                required
              />
              <TextArea
                label="Description"
                rows={4}
                placeholder="What this subject covers."
                value={selectedSubject.description || ''}
                disabled={isLoading}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  patchSubject(selectedSubject._id, { description: e.target.value })
                }
              />
            </div>
          </div>
        )
      }
      footer={
        <ModalFooter
          saveText="Save"
          cancelText="Cancel"
          onSave={saveSubject}
          onCancel={closeModal}
          isLoading={isLoading}
        />
      }
    />
  );
};
