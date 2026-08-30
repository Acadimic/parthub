import { API } from '../enums';
import { callAuthApi } from './http.service';

class AuthService {
  register = async () => {
    const url = 'auth/register';
    const resData = await callAuthApi(url, API.POST);
    return resData;
  };
}

export default new AuthService();
