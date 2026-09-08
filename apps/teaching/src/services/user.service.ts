import { IUser } from '@stores';
import { API, DefaultRole } from '../enums';
import { getProfilePayload } from '@repo/ui/lib';
import { callAuthApi } from './http.service';

class UserService {
  getInitialLoginData = async () => {
    const url = 'user/initial-login-data';
    return await callAuthApi(url, API.GET);
  };

  /** The signed-in user's own profile (account settings / onboarding). */
  updateProfile = async (user: IUser) => {
    const url = 'user/profile';
    return await callAuthApi(url, API.POST, getProfilePayload(user));
  };

  getOrgUsers = async () => {
    const url = 'user/all';
    return await callAuthApi(url, API.GET);
  };

  /** Invites create a pending invite; the member record is created when they first sign in. */
  inviteStudent = async (student: IUser) => {
    return await this.invite(student, DefaultRole.STUDENT);
  };

  inviteCollaborator = async (collaborator: IUser) => {
    return await this.invite(collaborator, collaborator.permission);
  };

  updateStudent = async (student: IUser) => {
    return await this.updateOrgUser(student);
  };

  updateCollaborator = async (collaborator: IUser) => {
    return await this.updateOrgUser(collaborator);
  };

  private invite = async (user: IUser, role: string) => {
    const url = 'invite/bulk/upsert';
    return await callAuthApi(url, API.POST, [{ _id: user._id, name: user.name, email: user.email, role }]);
  };

  private updateOrgUser = async (user: IUser) => {
    const url = 'user/update';
    return await callAuthApi(url, API.POST, { _id: user._id, ...getProfilePayload(user) });
  };
}

const instance = new UserService();
export default instance;
