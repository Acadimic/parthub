import { IBatchUpsert, IBatchUser } from '@interfaces';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class BatchService {
  upsertBatch = async (payload: IBatchUpsert) => {
    const url = `batch/${Subdomain.TEACH}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertBatchUserMappings = async (payloads: IBatchUser[]) => {
    const url = `batch/${Subdomain.TEACH}/upsert/mappings`;
    const resData = await callAuthApi(url, API.POST, payloads);
    return resData;
  };

  getBatchesData = async () => {
    const url = `batch/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new BatchService();
export default instance;
