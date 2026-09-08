import { type IBatch } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class BatchService {
  /**
   * `POST batch/upsert` takes one batch and nothing else.
   *
   * The parameter is the store's `IBatch`, not the `BatchDto` contract: contracts describe the
   * *response* form, where ownership fields are always present, and a write never sends them -- the
   * change-tracking plugin stamps them from the request context.
   *
   * This used to post `{ batch, users }`, which the server's `forbidNonWhitelisted` pipe rejects —
   * neither key is a `BatchDto` property. Batch membership goes through
   * `MappingService.upsertUserBatchMapping`, which is the only route that accepts it.
   */
  upsertBatch = async (payload: IBatch) => {
    const url = 'batch/upsert';
    const resData = await callAuthApi<IBatch>(url, API.POST, payload);
    return resData;
  };

  /** `GET batch/all` returns the org's batches as a plain array. */
  getBatches = async () => {
    const url = 'batch/all';
    const resData = await callAuthApi<IBatch[]>(url, API.GET);
    return resData;
  };
}

const instance = new BatchService();
export default instance;
