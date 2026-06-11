import { API } from '../enums';
import { callAuthApi } from './http.service';

class AuthService {
  register = async () => {
    const url = 'auth/register';
    return await callAuthApi(url, API.POST);
  };
}

export default new AuthService();
