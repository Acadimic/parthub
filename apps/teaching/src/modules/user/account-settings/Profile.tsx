import { Select } from '@components/app/selects';
import { Button, Card, ModalFooter, TextInput } from '@repo/ui/app';
import { PencilLineIcon } from '@phosphor-icons/react';
import { Gender } from '@enums';
import { UserService } from '@services';
import { useSelectedUser, useUserLookups, useUserStore } from '@stores';
import { errorToast, formatPhoneNumber, successToast, validateEmail } from '@utils/helpers';
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

const REQUIRED_FIELDS: [keyof IState, string][] = [
  ['firstName', 'First name'],
  ['lastName', 'Last name'],
  ['phoneNumber', 'Phone number'],
  ['designation', 'Role'],
  ['gender', 'Gender'],
  ['email', 'Email'],
];

/** The label of the first required field left blank, or undefined when the form is complete. */
const getMissingFieldLabel = (state: IState) => REQUIRED_FIELDS.find(([key]) => !String(state[key] ?? '').trim())?.[1];

const getInitialState = (user: ReturnType<typeof useSelectedUser>): IState => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  designation: user?.designation || '',
  countryCode: user?.countryCode || '+91',
  phoneNumber: user?.phoneNumber || '',
  gender: user?.gender || Gender.OTHER,
  isLoading: false,
  isEditing: false,
});

export const Profile = () => {
  const userStore = useUserLookups();
  const { setUserName } = userStore;
  const { patchUser } = userStore;
  const selectedUser = useSelectedUser();
  const [state, setState] = useSetState<IState>(getInitialState(selectedUser));

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
      const missingLabel = getMissingFieldLabel(state);
      if (missingLabel) {
        errorToast({ message: `${missingLabel} is required!` });
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
      setUserName(selectedUser._id, { firstName: state.firstName });
      setUserName(selectedUser._id, { lastName: state.lastName });
      patchUser(selectedUser._id, { countryCode: state.countryCode });
      patchUser(selectedUser._id, { phoneNumber });
      patchUser(selectedUser._id, { designation: state.designation });
      patchUser(selectedUser._id, { gender: state.gender });
      // Read the user back after the patches: the one in this closure still has the old values.
      const updatedUser = useUserStore.getState().getUserById(selectedUser._id);
      if (updatedUser) await UserService.updateProfile(updatedUser);
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
          <div className="flex items-center justify-between border-b border-border border-dashed pb-1">
            <div className="text-lg font-medium">Your Profile</div>
            <div>
              <Button
                className="px-0 py-0 text-sm text-muted-foreground hover:text-primary"
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
                    className={`${!state.isEditing ? 'text-muted-foreground' : 'text-foreground'} text-sm font-medium`}
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
};
