import { clearLocalStorage } from '@repo/ui/lib';

import { logOut as signOut } from '../firebase';

export const logOut = () => {
  clearLocalStorage();
  signOut();
  window.location.replace('/signin');
};
