import { Button, Card, TextInput } from '@repo/ui/app';
import { type FirebaseError, getFirebaseErrorMessage, updateUserPassword } from '@utils/firebase';
import { errorToast, successToast, validateFieldValues } from '@utils/helpers';
import { useSelectedUser } from '@stores';
import { useState } from 'react';
import { useSetState } from 'react-use';

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
    <div className="flex flex-col">
      <Card>
        <div className="flex w-full flex-col gap-6">
          <div className="flex items-center justify-between border-b border-dashed border-border pb-1">
            <div className="text-lg font-medium">Password</div>
            {!isEditing && (
              <Button
                className="px-0 py-0 text-sm text-muted-foreground hover:text-primary"
                isSubtle
                text="Change"
                onClick={() => setIsEditing(true)}
              />
            )}
          </div>
          {isEditing ? (
            <>
              <div className="w-full md:w-[50%]">
                <TextInput
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={state.currentPassword}
                  onChange={handleTextInputChange}
                  required
                  disabled={state.isLoading}
                />
              </div>
              <div className="flex w-full flex-col gap-4 md:flex-row">
                <div className="w-full md:w-[50%]">
                  <TextInput
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={state.newPassword}
                    onChange={handleTextInputChange}
                    required
                    disabled={state.isLoading}
                  />
                </div>
                <div className="w-full md:w-[50%]">
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
              <div className="flex items-center gap-3">
                <Button text="Update Password" onClick={handleChangePassword} isLoading={state.isLoading} />
                <Button text="Cancel" isSecondary onClick={closeForm} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a strong password of at least {MIN_PASSWORD_LENGTH} characters that you do not reuse elsewhere.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
