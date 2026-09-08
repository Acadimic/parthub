import { Button, Card, ModalFooter, Select, TextInput } from '@components/app';
import { Gender } from '@enums';
import { PencilLineIcon } from '@phosphor-icons/react';
import { UserService } from '@services';
import { useStores } from '@stores';
import { errorToast, formatPhoneNumber, successToast, validateEmail } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useSetState } from 'react-use';

interface IState {
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  gender: Gender;
  countryCode: string;
  phoneNumber: string;
  isLoading: boolean;
  isEditing: boolean;
}

export const Profile = observer(() => {
  const { selectorStore } = useStores();
  const { selectedUser } = selectorStore;
  const [state, setState] = useSetState<IState>({
    firstName: selectedUser?.firstName || '',
    lastName: selectedUser?.lastName || '',
    email: selectedUser?.email || '',
    designation: selectedUser?.designation || '',
    countryCode: selectedUser?.countryCode || '+91',
    phoneNumber: selectedUser?.phoneNumber || '',
    gender: selectedUser?.gender || Gender.OTHER,
    isLoading: false,
    isEditing: false,
  });

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ [e.target.name]: e.target.value });
  };

  const toggleEdit = (isEditing: boolean) => {
    setState({ isEditing });
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    try {
      const phoneNumber = formatPhoneNumber(state.phoneNumber);
      if (!state.firstName?.trim()) {
        errorToast({ message: 'First name is required!' });
        return;
      }
      if (!state.lastName?.trim()) {
        errorToast({ message: 'Last name is required!' });
        return;
      }
      if (!state.phoneNumber?.trim()) {
        errorToast({ message: 'Phone number is required!' });
        return;
      }
      if (!state.designation?.trim()) {
        errorToast({ message: 'Role is required!' });
        return;
      }
      if (!state.gender) {
        errorToast({ message: 'Gender is required!' });
        return;
      }
      if (!state.email?.trim()) {
        errorToast({ message: 'Email is required!' });
        return;
      }
      if (!validateEmail(state.email)) {
        errorToast({ message: 'Invalid email address!' });
        return;
      }
      if (phoneNumber.length !== 10) {
        errorToast({ message: 'Invalid phone number!' });
        return;
      }
      setState({ isLoading: true });
      selectedUser.setFirstName(state.firstName);
      selectedUser.setLastName(state.lastName);
      selectedUser.setCountryCode(state.countryCode);
      selectedUser.setPhoneNumber(phoneNumber);
      selectedUser.setDesignation(state.designation);
      selectedUser.setGender(state.gender);
      await UserService.updateProfile(selectedUser);
      successToast({ message: 'Profile updated successfully!' });
      toggleEdit(false);
    } catch (error) {
      console.error(error);
    } finally {
      setState({ isLoading: false });
    }
  };

  useEffect(() => {
    setState({
      firstName: selectedUser?.firstName || '',
      lastName: selectedUser?.lastName || '',
      email: selectedUser?.email || '',
      designation: selectedUser?.designation || '',
      countryCode: selectedUser?.countryCode || '+91',
      phoneNumber: selectedUser?.phoneNumber || '',
      gender: selectedUser?.gender,
    });
  }, [selectedUser?._id, state.isEditing]);

  if (!selectedUser) return <></>;

  return (
    <div className="flex flex-col">
      <Card>
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between border-b border-color-border border-dashed pb-1">
            <div className="text-lg font-medium">Your Profile</div>
            <div>
              <Button
                className="px-0 py-0 text-sm text-color-secondary hover:text-blue-primary"
                isSubtle
                text={state.isEditing ? 'Close' : 'Edit'}
                leftsection={<PencilLineIcon />}
                onClick={() => toggleEdit(!state.isEditing)}
                isLoading={state.isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="w-full md:w-[50%]">
              <TextInput
                label="First Name"
                value={state.firstName}
                onChange={handleTextInputChange}
                name="firstName"
                required
                disabled={!state.isEditing || state.isLoading}
              />
            </div>
            <div className="w-full md:w-[50%]">
              <TextInput
                label="Last Name"
                value={state.lastName}
                onChange={handleTextInputChange}
                name="lastName"
                required
                disabled={!state.isEditing || state.isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="w-full md:w-[50%]">
              <TextInput
                label="Role"
                value={state.designation}
                onChange={handleTextInputChange}
                name="designation"
                required
                disabled={!state.isEditing || state.isLoading}
              />
            </div>
            <div className="w-full md:w-[50%]">
              <Select
                label="Gender"
                values={[state.gender]}
                items={Object.values(Gender).map((gender) => ({
                  label: gender,
                  value: gender,
                }))}
                required
                isDisabled={!state.isEditing || state.isLoading}
                onChange={(values) => values[0] && setState({ gender: values[0].value as Gender })}
                isSingleSelect
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="w-full md:w-[50%]">
              <TextInput
                label="Phone Number"
                value={state.phoneNumber}
                onChange={handleTextInputChange}
                name="phoneNumber"
                required
                disabled={!state.isEditing || state.isLoading}
                leftsection={
                  <div
                    className={`${!state.isEditing ? 'text-color-secondary' : 'text-color-primary'} text-sm font-medium`}
                  >
                    {state.countryCode}
                  </div>
                }
                type="number"
              />
            </div>
            <div className="w-full md:w-[50%]">
              <TextInput
                label="Email"
                value={state.email}
                onChange={handleTextInputChange}
                name="email"
                required
                disabled={true || !state.isEditing || state.isLoading}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-8">
          {state.isEditing ? (
            <ModalFooter onSave={handleSaveProfile} onCancel={() => toggleEdit(false)} isLoading={state.isLoading} />
          ) : null}
        </div>
      </Card>
    </div>
  );
});
