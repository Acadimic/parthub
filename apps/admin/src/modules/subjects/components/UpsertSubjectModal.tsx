import { UploadAvatar } from '@components/app/attachments';
import { Label, Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { PositionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { SubjectService } from '@services';
import { useStores } from '@stores';
import { successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertSubjectModal = observer(({ isOpen, onClose }: IProps) => {
  const { selectorStore, standardStore } = useStores();
  const { removeSubject, loadSubjects } = standardStore;
  const { selectedSubject, setSelectedSubjectId } = selectorStore;
  const [isLoading, setIsLoading] = useState(false);
  const { uploadFilesToS3 } = useAttachment();
  const [selectedFile, setSelectedFile] = useState<File>();

  const closeModal = async () => {
    if (!selectedSubject) return;
    if (selectedSubject.isNew) removeSubject(selectedSubject._id);
    if (!selectedSubject.isNew) await loadSubjects();
    setSelectedSubjectId('');
    setSelectedFile(undefined);
    onClose();
  };

  const saveSubject = async () => {
    if (!selectedSubject) return;
    try {
      setIsLoading(true);
      if (selectedFile) {
        const attachments = await uploadFilesToS3(selectedSubject._id, [selectedFile]);
        attachments && selectedSubject.setLogo(attachments[0].url);
      }
      await SubjectService.upsertSubject(selectedSubject);
      selectedSubject.resetIsNew();
      successToast({ message: 'Subject added successfully.' });
      closeModal();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = () => {
    if (!selectedSubject) return;
    selectedSubject.removeLogo();
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
                <Label label="Standard Logo" required />
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectedSubject.setName(e.target.value)}
                required
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
});
