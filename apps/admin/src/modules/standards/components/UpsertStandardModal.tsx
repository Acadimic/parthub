import { Label, Modal, ModalFooter, Select, TextInput, UploadAvatar } from '@components/app';
import { PositionType, StandardGroup } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { ISelectItem } from '@interfaces';
import { StandardService } from '@services';
import { useStores } from '@stores';
import { successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertStandardModal = observer(({ isOpen, onClose }: IProps) => {
  const { selectorStore, standardStore } = useStores();
  const {
    removeStandard,
    removeStandardSubjectMappings,
    getStandardSubjectMappings,
    getNextStandardGroupOrder,
    createStandardSubjectMapping,
    subjects,
    standards,
    loadStandards,
    loadStandardSubjectMappings,
  } = standardStore;
  const { selectedStandard, setSelectedStandardId } = selectorStore;
  const [isLoading, setIsLoading] = useState(false);
  const { uploadFilesToS3 } = useAttachment();
  const [selectedFile, setSelectedFile] = useState<File>();

  const closeModal = async () => {
    if (!selectedStandard) return;
    const newMappings = getStandardSubjectMappings(selectedStandard._id).filter((mapping) => mapping.isNew);
    removeStandardSubjectMappings(newMappings);
    if (selectedStandard.isNew) removeStandard(selectedStandard._id);
    if (!selectedStandard.isNew) await Promise.all([loadStandards(), loadStandardSubjectMappings()]);
    setSelectedStandardId('');
    setSelectedFile(undefined);
    onClose();
  };

  const saveStandard = async () => {
    if (!selectedStandard) return;
    try {
      setIsLoading(true);
      if (selectedFile) {
        const attachments = await uploadFilesToS3(selectedStandard._id, [selectedFile]);
        attachments && selectedStandard.setLogo(attachments[0].url);
      }
      await StandardService.upsertStandard(selectedStandard);
      const mappings = getStandardSubjectMappings(selectedStandard._id);
      await StandardService.upsertStandardSubjectMappings(mappings);
      mappings.forEach((mapping) => mapping.resetIsNew());
      selectedStandard.resetIsNew();
      successToast({ message: 'Standard added successfully.' });
      closeModal();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = () => {
    if (!selectedStandard) return;
    selectedStandard.removeLogo();
    setSelectedFile(undefined);
  };

  const setGroup = (group: StandardGroup) => {
    if (!selectedStandard) return;
    selectedStandard.setGroup(group);
    const order = getNextStandardGroupOrder(selectedStandard._id, group);
    selectedStandard.setOrder(`${order}`);
  };

  const handleSubjectChange = (values: ISelectItem[]) => {
    if (!selectedStandard) return;
    values.forEach((value) => {
      createStandardSubjectMapping(selectedStandard._id, value.value);
    });
    const mappings = getStandardSubjectMappings(selectedStandard._id);
    const removedMappings = mappings.filter((mapping) => !values.find((value) => value.value === mapping.subject));
    removeStandardSubjectMappings(removedMappings);
  };

  const handleReferenceStandardChange = (values: ISelectItem[]) => {
    if (!selectedStandard) return;
    const mappings = getStandardSubjectMappings(selectedStandard._id);
    mappings.forEach((mapping) => {
      mapping.addReferenceStandards(values.map((value) => value.value));
    });
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      title={`${!selectedStandard?.isNew ? 'Update' : 'Create'} Standard`}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={closeModal}
      component={
        selectedStandard && (
          <div className="min-h-[60vh] pb-4">
            <div className="flex flex-col space-y-3">
              <div>
                <Label label="Standard Logo" required />
                <div className="flex justify-center mt-1">
                  <div className="w-full">
                    <UploadAvatar
                      url={selectedStandard.logo}
                      file={selectedFile}
                      setFile={setSelectedFile}
                      removeFile={removeLogo}
                    />
                  </div>
                </div>
              </div>
              <TextInput
                label="Standard Name"
                value={selectedStandard.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectedStandard.setName(e.target.value)}
                required
              />
              <Select
                label="Group"
                items={Object.values(StandardGroup).map((item) => ({ label: item, value: item }))}
                required
                isSingleSelect
                values={selectedStandard.group ? [selectedStandard.group] : []}
                onChange={(values) => values[0] && setGroup(values[0].value as StandardGroup)}
              />
              <TextInput
                label="Order"
                type="number"
                value={!selectedStandard.order ? '' : selectedStandard.order.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectedStandard.setOrder(e.target.value)}
                required
              />
              <Select
                label="Subjects"
                items={subjects.map((subject) => ({ label: subject.name, value: subject._id }))}
                required
                values={selectedStandard.subjects}
                onChange={handleSubjectChange}
              />
              <TextInput
                label="Alias"
                value={selectedStandard.alias || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectedStandard.setAlias(e.target.value)}
              />
              <Select
                label="Reference Standards"
                items={standards
                  .filter((standard) => standard._id !== selectedStandard._id)
                  .map((standard) => ({ label: standard.name, value: standard._id, group: standard.group }))}
                values={selectedStandard.referenceStandards}
                onChange={handleReferenceStandardChange}
                isGrouped
              />
            </div>
          </div>
        )
      }
      footer={
        <ModalFooter
          saveText="Save"
          cancelText="Cancel"
          onSave={saveStandard}
          onCancel={closeModal}
          isLoading={isLoading}
        />
      }
    />
  );
});
