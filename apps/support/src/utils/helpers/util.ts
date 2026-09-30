import { clearBrowserStorage } from '@repo/ui/lib';

import { logOut as signOut } from '../firebase';

export const logOut = () => {
  clearBrowserStorage();
  signOut();
  window.location.replace('/signin');
};
