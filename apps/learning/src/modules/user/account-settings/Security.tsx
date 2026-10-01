import { KeyIcon, SignOutIcon } from '@phosphor-icons/react';
import { Button, TextInput } from '@repo/ui/app';
import { getFullFormattedDate } from '@repo/ui/lib';
import { useSelectedUser } from '@stores';
import { type FirebaseError, getFirebaseErrorMessage, updateUserPassword } from '@utils/firebase';
import { errorToast, logOut, successToast, validateFieldValues } from '@utils/helpers';
import { useState } from 'react';
import { useSetState } from 'react-use';
import { FieldValue, SettingsSection } from './SettingsSection';

const MIN_PASSWORD_LENGTH = 8;

interface IState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
}

const INITIAL_STATE: IState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  isLoading: false,
};

export const Security = () => {
  const selectedUser = useSelectedUser();
  const [state, setState] = useSetState<IState>(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ [e.target.name]: e.target.value });
  };

  const closeForm = () => {
    if (state.isLoading) return;
    setState(INITIAL_STATE);
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    const errors = validateFieldValues(state, ['currentPassword', 'newPassword', 'confirmPassword']);
    if (errors.length) return;
    if (state.newPassword.trim().length < MIN_PASSWORD_LENGTH) {
      errorToast({ message: `Password should not be less than ${MIN_PASSWORD_LENGTH} chars.` });
      return;
    }
    if (state.newPassword !== state.confirmPassword) {
      errorToast({ message: 'New password and confirmation do not match.' });
      return;
    }
    if (state.newPassword === state.currentPassword) {
      errorToast({ message: 'New password must differ from the current one.' });
      return;
    }
    try {
      setState({ isLoading: true });
      // Re-authenticates with the current password, then signs back in with the new one.
      await updateUserPassword(state.currentPassword, state.newPassword);
      successToast({ message: 'Password updated successfully!' });
      setState(INITIAL_STATE);
      setIsEditing(false);
    } catch (error) {
      errorToast({ message: getFirebaseErrorMessage(error as FirebaseError) });
    } finally {
      setState({ isLoading: false });
    }
  };

  if (!selectedUser) return <></>;

  return (
    <>
      <SettingsSection
        title="Password"
        description={`Use at least ${MIN_PASSWORD_LENGTH} characters that you do not reuse on another site.`}
        action={
          isEditing ? null : (
            <Button
              isSecondary
              className="px-3 py-1.5 text-sm"
              text="Change password"
              leftsection={<KeyIcon weight="bold" className="h-4 w-4" />}
              onClick={() => setIsEditing(true)}
            />
          )
        }
        footer={
          isEditing ? (
            <>
              <Button isSecondary text="Cancel" onClick={closeForm} disabled={state.isLoading} />
              <Button text="Update password" onClick={handleChangePassword} isLoading={state.isLoading} />
            </>
          ) : null
        }
      >
        {isEditing ? (
          <div className="grid max-w-xl grid-cols-1 gap-5">
            <TextInput
              label="Current Password"
              type="password"
              name="currentPassword"
              value={state.currentPassword}
              onChange={handleTextInputChange}
              required
              autoFocus
              disabled={state.isLoading}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextInput
                label="New Password"
                type="password"
                name="newPassword"
                value={state.newPassword}
                onChange={handleTextInputChange}
                required
                disabled={state.isLoading}
              />
              <TextInput
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={state.confirmPassword}
                onChange={handleTextInputChange}
                required
                disabled={state.isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-primary">
              <KeyIcon weight="bold" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Password is set</p>
              <p className="text-xs text-muted-foreground">
                You sign in with your email and password. Change it here if you think it has been shared.
              </p>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="This account"
        description="Where you are signed in, and how to leave."
        action={
          <Button
            isSecondary
            className="px-3 py-1.5 text-sm"
            text="Sign out"
            leftsection={<SignOutIcon weight="bold" className="h-4 w-4" />}
            onClick={logOut}
          />
        }
      >
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <FieldValue label="Signed in as" value={selectedUser.email} />
          <FieldValue
            label="Member since"
            value={selectedUser.createdAt ? getFullFormattedDate(selectedUser.createdAt) : ''}
          />
        </dl>
      </SettingsSection>
    </>
  );
};
