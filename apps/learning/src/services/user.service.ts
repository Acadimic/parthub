import { IUser } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class UserService {
  getInitialLoginData = async () => {
    const url = 'user/learn/initial-login-data';
    return await callAuthApi(url, API.GET);
  };

  updateStudent = async (student: IUser) => {
    const url = 'user/update/student';
    const resData = await callAuthApi(url, API.POST, student);
    return resData;
  };
}

export default new UserService();
