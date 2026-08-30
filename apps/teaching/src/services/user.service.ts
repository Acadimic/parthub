import { IUser } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class UserService {
  getInitialLoginData = async () => {
    const url = `user/${Subdomain.TEACH}/initial-login-data`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getOrgUsers = async () => {
    const url = `user/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  inviteStudent = async (student: IUser) => {
    const url = `user/${Subdomain.TEACH}/invite/student`;
    const resData = await callAuthApi(url, API.POST, student);
    return resData;
  };

  updateStudent = async (student: IUser) => {
    const url = `user/${Subdomain.TEACH}/update/student`;
    const resData = await callAuthApi(url, API.POST, student);
    return resData;
  };

  inviteCollaborator = async (collaborator: IUser) => {
    const url = `user/${Subdomain.TEACH}/invite/collaborator`;
    const resData = await callAuthApi(url, API.POST, collaborator);
    return resData;
  };

  updateCollaborator = async (collaborator: IUser) => {
    const url = `user/${Subdomain.TEACH}/update/collaborator`;
    const resData = await callAuthApi(url, API.POST, collaborator);
    return resData;
  };
}

const instance = new UserService();
export default instance;
