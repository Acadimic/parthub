import { API } from '../enums';
import { callAuthApi, callUnAuthApi } from './http.service';

class CommonService {
  getInitialData = async () => {
    return await callAuthApi('common/initial-data', API.GET);
  };

  getPublicData = async () => {
    return await callUnAuthApi('common/public-data', API.GET);
  };
}

export default new CommonService();
