import { IUser } from '@stores';
import { API, Subdomain } from '../enums';
import { getProfilePayload } from '@parthhub/ui/lib';
import { callAuthApi } from './http.service';

class UserService {
  getInitialLoginData = async () => {
    const url = `user/${Subdomain.LEARN}/initial-login-data`;
    return await callAuthApi(url, API.GET);
  };

  /** The signed-in learner's own profile (account settings / onboarding). */
  updateProfile = async (user: IUser) => {
    const url = `user/${Subdomain.LEARN}/profile`;
    return await callAuthApi(url, API.POST, getProfilePayload(user));
  };

  /** @deprecated use updateProfile; kept so existing call sites keep working. */
  updateStudent = async (student: IUser) => this.updateProfile(student);
}

export default new UserService();
