import { API } from '../enums';
import { callAuthApi } from './http.service';

class BatchService {
  getBatchesData = async () => {
    const url = 'batch/all';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new BatchService();
export default instance;
