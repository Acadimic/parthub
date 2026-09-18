import { UploadAvatar } from '@components/app/attachments';
import { Select } from '@components/app/selects';
import { Label, Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { PositionType, StandardGroup } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { type ISelectItem } from '@interfaces';
import { StandardService } from '@services';
import { useSelectedStandard, useSelectorStore, useStandardStore } from '@stores';
import { successToast } from '@utils/helpers';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertStandardModal = ({ isOpen, onClose }: IProps) => {
  const selectedStandard = useSelectedStandard();
  const selectedStandardId = useSelectorStore((state) => state.selectedStandardId);
  const patchStandard = useStandardStore((state) => state.patchStandard);
  const renameStandard = useStandardStore((state) => state.renameStandard);
  const setReferenceStandards = useStandardStore((state) => state.setReferenceStandards);
  const createStandardSubjectMapping = useStandardStore((state) => state.createStandardSubjectMapping);
  const removeStandardSubjectMappings = useStandardStore((state) => state.removeStandardSubjectMappings);
  // Select the stored rows, and build the select items here rather than in the store. `useShallow`
  // compares an array element by element with `Object.is`, so a selector that maps rows to fresh
  // `{ label, value }` objects never compares equal and re-renders this screen to death.
  const subjects = useStandardStore(useShallow((state) => state.getSubjects()));
  const standards = useStandardStore(useShallow((state) => state.getStandards()));
  const subjectItems = useMemo(
    () => subjects.map((subject) => ({ label: subject.name, value: subject._id })),
    [subjects],
  );
  const referenceStandardItems = useMemo(
    () =>
      standards
        .filter((standard) => standard._id !== selectedStandardId)
        .map((standard) => ({ label: standard.name, value: standard._id, group: standard.group })),
    [standards, selectedStandardId],
  );
  const subjectIds = useStandardStore(useShallow((state) => state.getStandardSubjectIds(selectedStandardId)));
  const referenceStandardIds = useStandardStore(
    useShallow((state) => state.getReferenceStandardIds(selectedStandardId)),
  );
  const [isLoading, setIsLoading] = useState(false);
  const { uploadFilesToS3 } = useAttachment();
  const [selectedFile, setSelectedFile] = useState<File>();

  const closeModal = async () => {
    const standardId = useSelectorStore.getState().selectedStandardId;
    const store = useStandardStore.getState();
    const standard = store.getStandardById(standardId);
    if (!standard) return;
    const newMappings = store.getStandardSubjectMappings(standardId).filter((mapping) => mapping.isNew);
    store.removeStandardSubjectMappings(newMappings);
    if (standard.isNew) store.removeStandard(standardId);
    else await Promise.all([store.loadStandards(), store.loadStandardSubjectMappings()]);
    useSelectorStore.getState().setSelectedStandardId('');
    setSelectedFile(undefined);
    onClose();
  };

  const saveStandard = async () => {
    const standardId = selectedStandard?._id;
    if (!standardId) return;
    try {
      setIsLoading(true);
      if (selectedFile) {
        const attachments = await uploadFilesToS3(standardId, [selectedFile]);
        if (attachments.length) patchStandard(standardId, { logo: attachments[0].url });
      }
      // Read the rows back rather than posting `selectedStandard`: the store holds immutable rows,
      // so the copy captured during render does not carry the logo patch above.
      const store = useStandardStore.getState();
      const standard = store.getStandardById(standardId);
      if (!standard) return;
      await StandardService.upsertStandard(standard);
      const mappings = store.getStandardSubjectMappings(standardId);
      await StandardService.upsertStandardSubjectMappings(mappings);
      // Both are saved now, so clear the draft flag on the standard and on every mapping.
      store.addStandardSubjectMappings(mappings.map((mapping) => ({ ...mapping, isNew: false })));
      store.patchStandard(standardId, { isNew: false });
      successToast({ message: 'Standard added successfully.' });
      closeModal();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = () => {
    if (!selectedStandard) return;
    patchStandard(selectedStandard._id, { logo: null });
    setSelectedFile(undefined);
  };

  const setGroup = (group: StandardGroup) => {
    if (!selectedStandard) return;
    const order = useStandardStore.getState().getNextStandardGroupOrder(selectedStandard._id, group);
    patchStandard(selectedStandard._id, { group, order });
  };

  const setOrder = (order: string) => {
    if (!selectedStandard) return;
    patchStandard(selectedStandard._id, { order: Number(order) || 0 });
  };

  const handleSubjectChange = (values: ISelectItem[]) => {
    if (!selectedStandard) return;
    const standardId = selectedStandard._id;
    values.forEach((value) => createStandardSubjectMapping(standardId, value.value));
    const mappings = useStandardStore.getState().getStandardSubjectMappings(standardId);
    const removedMappings = mappings.filter((mapping) => !values.find((value) => value.value === mapping.subject));
    removeStandardSubjectMappings(removedMappings);
  };

  const handleReferenceStandardChange = (values: ISelectItem[]) => {
    if (!selectedStandard) return;
    setReferenceStandards(
      selectedStandard._id,
      values.map((value) => value.value),
    );
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  renameStandard(selectedStandard._id, e.target.value)
                }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrder(e.target.value)}
                required
              />
              <Select
                label="Subjects"
                items={subjectItems}
                required
                values={subjectIds}
                onChange={handleSubjectChange}
              />
              <TextInput
                label="Alias"
                value={selectedStandard.alias || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  patchStandard(selectedStandard._id, { alias: e.target.value })
                }
              />
              <Select
                label="Reference Standards"
                items={referenceStandardItems}
                values={referenceStandardIds}
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
};
