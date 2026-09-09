import { type InitialDataDto } from '@repo/shared/contracts';
import { type IUser } from '@stores';
import { API } from '../enums';
import { getProfilePayload } from '@repo/ui/lib';
import { callAuthApi } from './http.service';

class UserService {
  getInitialLoginData = async () => {
    const url = 'user/initial-login-data';
    return await callAuthApi<InitialDataDto>(url, API.GET);
  };

  /** The signed-in learner's own profile (account settings / onboarding). */
  updateProfile = async (user: IUser) => {
    const url = 'user/profile';
    return await callAuthApi(url, API.POST, getProfilePayload(user));
  };
}

export default new UserService();
