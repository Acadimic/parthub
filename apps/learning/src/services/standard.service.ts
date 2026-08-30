import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class StandardService {
  getStandards = async () => {
    const url = `standard/${Subdomain.LEARN}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getStandardSubjectMappings = async () => {
    const url = `standard/${Subdomain.LEARN}/mapping/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new StandardService();
export default instance;
