import { type IUser } from '@stores';
import { API } from '../enums';
import { getProfilePayload } from '@repo/ui/lib';
import { callAuthApi } from './http.service';

class UserService {
  getInitialLoginData = async () => {
    const url = 'user/initial-login-data';
    return await callAuthApi(url, API.GET);
  };

  /** The signed-in learner's own profile (account settings / onboarding). */
  updateProfile = async (user: IUser) => {
    const url = 'user/profile';
    return await callAuthApi(url, API.POST, getProfilePayload(user));
  };

  /** @deprecated use updateProfile; kept so existing call sites keep working. */
  updateStudent = async (student: IUser) => this.updateProfile(student);
}

export default new UserService();
