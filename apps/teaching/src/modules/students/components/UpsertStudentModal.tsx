import { DateInput, Modal, ModalFooter, Select, TextInput } from '@components/app';
import { Gender, PositionType } from '@enums';
import { ISelectItem } from '@interfaces';
import { UserService } from '@services';
import { useStores } from '@stores';
import { getFormattedDate, successToast, validateFieldValues } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertStudentModal = observer(({ isOpen, onClose }: IProps) => {
  const { userStore, selectorStore, standardStore } = useStores();
  const { getStudentStandardsByStudentId, loadStudentStandardMappings, removeUserByUserId } = userStore;
  const { selectedStudent } = selectorStore;
  const { standardItems } = standardStore;
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => {
    if (isLoading) return;
    onClose();
  };

  const onChangeFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedStudent) return;
    const value = e.target.value;
    selectedStudent.setFirstName(value);
  };

  const onChangeLastName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedStudent) return;
    const value = e.target.value;
    selectedStudent.setLastName(value);
  };

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedStudent) return;
    selectedStudent.setEmail(e.target.value);
  };

  const onChangeDob = (date: Date) => {
    if (!selectedStudent) return;
    selectedStudent.setDob(getFormattedDate(date));
  };

  const handleGenderChange = (values: ISelectItem[]) => {
    if (!values.length || !selectedStudent) return;
    selectedStudent.setGender(values[0].value as Gender);
  };

  const handleStandardsChange = (values: ISelectItem[]) => {
    if (!selectedStudent) return;
    selectedStudent.setStandards(values.map((value) => value.value));
  };

  const handleSaveStudent = async () => {
    if (!selectedStudent) return;
    const isNewStudent = selectedStudent.isNew;
    try {
      setIsLoading(true);
      const errors = validateFieldValues(selectedStudent, ['firstName', 'lastName', 'name', 'email', 'standards']);
      if (errors.length) return;
      if (!selectedStudent.gender) selectedStudent.setGender(Gender.OTHER);
      if (isNewStudent) await UserService.inviteStudent(selectedStudent);
      else await UserService.updateStudent(selectedStudent);
      successToast({ message: isNewStudent ? 'Student invited successfully!' : 'Student updated successfully!' });
      await loadStudentStandardMappings();
      // An invite creates no member yet; the store entry was only a form model, so drop it
      // instead of showing a student that does not exist on the server.
      if (isNewStudent) removeUserByUserId(selectedStudent._id);
      else selectedStudent.resetIsNew();
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
        title={`${selectedStudent?.isNew ? 'Invite' : 'Update'} Student`}
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          selectedStudent && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="w-full md:w-[50%]">
                    <TextInput
                      label="First Name"
                      required
                      value={selectedStudent.firstName}
                      onChange={onChangeFirstName}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="w-full md:w-[50%]">
                    <TextInput
                      label="Last Name"
                      required
                      value={selectedStudent.lastName}
                      onChange={onChangeLastName}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <TextInput
                  label="Email"
                  required
                  value={selectedStudent.email}
                  onChange={onChangeEmail}
                  disabled={isLoading}
                />
                <Select
                  label="Enrolled Standards"
                  items={standardItems}
                  values={
                    selectedStudent?.isNew
                      ? selectedStudent.standards
                      : getStudentStandardsByStudentId(selectedStudent._id).map((standard) => standard._id)
                  }
                  onChange={handleStandardsChange}
                  isCloseOnSelect
                  isGrouped
                  required
                  isDisabled={isLoading}
                />
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="w-full md:w-[50%]">
                    <Select
                      label="Gender"
                      items={Object.values(Gender).map((item) => ({ label: item, value: item }))}
                      values={selectedStudent.gender ? [selectedStudent.gender] : []}
                      onChange={handleGenderChange}
                      isSingleSelect
                    />
                  </div>
                  <div className="w-full md:w-[50%]">
                    <DateInput
                      label="Enter DOB"
                      value={selectedStudent.dob ? new Date(selectedStudent.dob) : null}
                      handleChange={onChangeDob}
                      isDisabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        }
        footer={
          <ModalFooter
            saveText="Save"
            cancelText="Cancel"
            onSave={handleSaveStudent}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        }
      />
    </>
  );
});
