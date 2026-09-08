import { toPayload } from '@repo/ui/lib';
import { type IBatchUpsert, type IBatchUser } from '@interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class BatchService {
  upsertBatch = async (payload: IBatchUpsert) => {
    const url = 'batch/upsert';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  upsertBatchUserMappings = async (payloads: IBatchUser[]) => {
    const url = 'batch/upsert/mappings';
    const resData = await callAuthApi(url, API.POST, payloads);
    return resData;
  };

  getBatchesData = async () => {
    const url = 'batch/all';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new BatchService();
export default instance;
