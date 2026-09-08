import { Select } from '@components/app/selects';
import { Modal, ModalFooter, TextInput } from '@parthhub/ui/app';
import { PositionType } from '@enums';
import { ISelectItem } from '@interfaces';
import { BatchService } from '@services';
import { useStores } from '@stores';
import { successToast, validateFieldValues } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useSetState } from 'react-use';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IState {
  name: string;
  standard: string;
  year: number;
  collaborators: string[];
  students: string[];
  isLoading: boolean;
}

const year = new Date().getFullYear();

export const UpsertBatchModal = observer(({ isOpen, onClose }: IProps) => {
  const { batchStore, selectorStore, standardStore, userStore } = useStores();
  const { createBatch, loadBatchesData, getBatchStudentIds, getBatchCollaboratorIds, removeBatchById } = batchStore;
  const { selectedBatch } = selectorStore;
  const { standardItems } = standardStore;
  const { students, collaborators } = userStore;
  const [state, setState] = useSetState<IState>({
    name: '',
    standard: '',
    year,
    collaborators: [],
    students: [],
    isLoading: false,
  });

  const closeModal = () => {
    if (state.isLoading) return;
    if (selectedBatch && selectedBatch.isNew) removeBatchById(selectedBatch._id);
    onClose();
  };

  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState({ name: value });
  };

  const onChangeYear = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setState({ year: isNaN(value) ? year : value });
  };

  const handleStandardChange = (values: ISelectItem[]) => {
    if (values[0]) setState({ standard: values[0].value });
    else setState({ standard: '' });
  };

  const handleCollaboratorsChange = (values: ISelectItem[]) => {
    setState({ collaborators: values.map((item) => item.value) });
  };

  const handleStudentsChange = (values: ISelectItem[]) => {
    setState({ students: values.map((item) => item.value) });
  };

  const handleSaveBatch = async () => {
    try {
      setState({ isLoading: true });
      const errors = validateFieldValues(state, ['name', 'standard']);
      if (errors.length) return;
      const batch = selectedBatch || createBatch(state.name, state.standard);
      batch.setName(state.name);
      batch.setStandard(state.standard);
      batch.setYear(state.year);
      const isNewBatch = batch.isNew;
      await BatchService.upsertBatch({ batch, users: [...state.collaborators, ...state.students] });
      successToast({ message: isNewBatch ? 'Batch created successfully!' : 'Batch updated successfully!' });
      await loadBatchesData();
      batch.resetIsNew();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setState({ isLoading: false });
    }
  };

  useEffect(() => {
    if (selectedBatch) {
      setState({
        name: selectedBatch.name,
        standard: selectedBatch.standard,
        collaborators: getBatchCollaboratorIds(selectedBatch._id),
        students: getBatchStudentIds(selectedBatch._id),
      });
    }
  }, [selectedBatch?._id]);

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title={`${selectedBatch?.isNew ? 'Update' : 'Create'} Batch`}
        isOpen={isOpen}
        isLoading={state.isLoading}
        onClose={closeModal}
        component={
          <div className="min-h-[60vh] pb-4">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="w-full md:w-[50%]">
                  <TextInput
                    label="Batch Name"
                    required
                    value={state.name}
                    onChange={onChangeName}
                    disabled={state.isLoading}
                  />
                </div>
                <div className="w-full md:w-[50%]">
                  <TextInput
                    label="Year"
                    required
                    type="number"
                    value={state.year}
                    onChange={onChangeYear}
                    disabled={state.isLoading}
                  />
                </div>
              </div>
              <Select
                label="Standard"
                items={standardItems}
                required
                values={state.standard ? [state.standard] : []}
                onChange={handleStandardChange}
                isSingleSelect
                isDisabled={state.isLoading}
                isGrouped
              />
              <Select
                label="Students"
                items={students.map((student) => ({
                  label: student.name,
                  value: student._id,
                  description: student.email,
                }))}
                required
                values={state.students}
                onChange={handleStudentsChange}
                isDisabled={state.isLoading}
              />
              <Select
                label="Collaborators"
                items={collaborators.map((collaborator) => ({
                  label: collaborator.name,
                  value: collaborator._id,
                  description: collaborator.email,
                }))}
                required
                values={state.collaborators}
                onChange={handleCollaboratorsChange}
                isDisabled={state.isLoading}
              />
            </div>
          </div>
        }
        footer={
          <ModalFooter
            saveText="Save"
            cancelText="Cancel"
            onSave={handleSaveBatch}
            onCancel={closeModal}
            isLoading={state.isLoading}
          />
        }
      />
    </>
  );
});
