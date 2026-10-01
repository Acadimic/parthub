import { Select } from '@components/app/selects';
import { Gender } from '@enums';
import { EnvelopeSimpleIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { Button, TextInput } from '@repo/ui/app';
import { UserService } from '@services';
import { useSelectedUser, useUserLookups, useUserStore } from '@stores';
import { capitalize, errorToast, formatPhoneNumber, successToast, validateEmail } from '@utils/helpers';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { FieldValue, SettingsSection } from './SettingsSection';

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

  const isDisabled = !state.isEditing || state.isLoading;
  const phone = selectedUser.phoneNumber ? `${selectedUser.countryCode || '+91'} ${selectedUser.phoneNumber}` : '';

  return (
    <>
      <SettingsSection
        title="Personal information"
        description="How you appear to teachers and classmates across Acadimic."
        action={
          state.isEditing ? null : (
            <Button
              isSecondary
              className="px-3 py-1.5 text-sm"
              text="Edit"
              leftsection={<PencilSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={() => toggleEdit(true)}
            />
          )
        }
        footer={
          state.isEditing ? (
            <>
              <Button isSecondary text="Cancel" onClick={() => toggleEdit(false)} disabled={state.isLoading} />
              <Button text="Save changes" onClick={handleSaveProfile} isLoading={state.isLoading} />
            </>
          ) : null
        }
      >
        {state.isEditing ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextInput
              label="First Name"
              value={state.firstName}
              onChange={handleTextInputChange}
              name="firstName"
              required
              disabled={isDisabled}
            />
            <TextInput
              label="Last Name"
              value={state.lastName}
              onChange={handleTextInputChange}
              name="lastName"
              required
              disabled={isDisabled}
            />
            <TextInput
              label="Role"
              value={state.designation}
              onChange={handleTextInputChange}
              name="designation"
              placeholder="Student, parent, tutor…"
              required
              disabled={isDisabled}
            />
            <Select
              label="Gender"
              values={[state.gender]}
              items={Object.values(Gender).map((gender) => ({ label: capitalize(gender), value: gender }))}
              required
              isDisabled={isDisabled}
              onChange={(values) => values[0] && setState({ gender: values[0].value as Gender })}
              isSingleSelect
            />
            <TextInput
              label="Phone Number"
              value={state.phoneNumber}
              onChange={handleTextInputChange}
              name="phoneNumber"
              required
              disabled={isDisabled}
              leftsection={<div className="text-sm font-medium text-foreground">{state.countryCode}</div>}
              type="number"
            />
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <FieldValue label="First name" value={selectedUser.firstName} />
            <FieldValue label="Last name" value={selectedUser.lastName} />
            <FieldValue label="Role" value={selectedUser.designation} />
            <FieldValue label="Gender" value={selectedUser.gender ? capitalize(selectedUser.gender) : ''} />
            <FieldValue label="Phone number" value={phone} />
          </dl>
        )}
      </SettingsSection>

      <SettingsSection
        title="Sign-in email"
        description="The address you sign in with. It also receives your receipts and reminders."
      >
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-primary">
            <EnvelopeSimpleIcon weight="bold" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{selectedUser.email}</p>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed here. Contact support to move your account.
            </p>
          </div>
        </div>
      </SettingsSection>
    </>
  );
};
