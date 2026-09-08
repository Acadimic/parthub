import { Select } from '@components/app/selects';
import { Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { Gender, PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { UserService } from '@services';
import { useStores } from '@stores';
import { successToast, validateFieldValues } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertCollaboratorModal = observer(({ isOpen, onClose }: IProps) => {
  const { selectorStore, userStore } = useStores();
  const { selectedCollaborator } = selectorStore;
  const { removeUserByUserId } = userStore;
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => {
    if (isLoading) return;
    onClose();
  };

  const onChangeFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCollaborator) return;
    const value = e.target.value;
    selectedCollaborator.setFirstName(value);
  };

  const onChangeLastName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCollaborator) return;
    const value = e.target.value;
    selectedCollaborator.setLastName(value);
  };

  const onChangeRole = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCollaborator) return;
    const value = e.target.value;
    selectedCollaborator.setDesignation(value);
  };

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCollaborator) return;
    selectedCollaborator.setEmail(e.target.value);
  };

  const handleGenderChange = (values: ISelectItem[]) => {
    if (!values.length || !selectedCollaborator) return;
    selectedCollaborator.setGender(values[0].value as Gender);
  };

  const handleSaveCollaborator = async () => {
    if (!selectedCollaborator) return;
    const isNewCollaborator = selectedCollaborator.isNew;
    try {
      setIsLoading(true);
      const errors = validateFieldValues(selectedCollaborator, [
        'firstName',
        'lastName',
        'name',
        'email',
        'gender',
        'designation',
      ]);
      if (errors.length) return;
      if (isNewCollaborator) await UserService.inviteCollaborator(selectedCollaborator);
      else await UserService.updateCollaborator(selectedCollaborator);
      successToast({
        message: isNewCollaborator ? 'Collaborator invited successfully!' : 'Collaborator updated successfully!',
      });
      // An invite creates no member yet; the store entry was only a form model, so drop it
      // instead of showing a collaborator that does not exist on the server.
      if (isNewCollaborator) removeUserByUserId(selectedCollaborator._id);
      else selectedCollaborator.resetIsNew();
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
        title={`${selectedCollaborator?.isNew ? 'Invite' : 'Update'} Collaborator`}
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          selectedCollaborator && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="w-full md:w-[50%]">
                    <TextInput
                      label="First Name"
                      required
                      value={selectedCollaborator.firstName}
                      onChange={onChangeFirstName}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="w-full md:w-[50%]">
                    <TextInput
                      label="Last Name"
                      required
                      value={selectedCollaborator.lastName}
                      onChange={onChangeLastName}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="w-full md:w-[50%]">
                    <TextInput
                      label="Email"
                      required
                      value={selectedCollaborator.email}
                      onChange={onChangeEmail}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="w-full md:w-[50%]">
                    <Select
                      label="Gender"
                      items={Object.values(Gender).map((item) => ({ label: item, value: item }))}
                      required
                      values={selectedCollaborator.gender ? [selectedCollaborator.gender] : []}
                      onChange={handleGenderChange}
                      isSingleSelect
                    />
                  </div>
                </div>
                <TextInput
                  label="Role"
                  required
                  value={selectedCollaborator.designation}
                  onChange={onChangeRole}
                  disabled={isLoading}
                />
              </div>
            </div>
          )
        }
        footer={
          <ModalFooter
            saveText="Save"
            cancelText="Cancel"
            onSave={handleSaveCollaborator}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        }
      />
    </>
  );
});
