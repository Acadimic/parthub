import { API } from '../enums';
import { callAuthApi } from './http.service';

class UserService {
  getInitialLoginData = async () => {
    const url = 'user/learn/initial-login-data';
    return await callAuthApi(url, API.GET);
  };
}

export default new UserService();
