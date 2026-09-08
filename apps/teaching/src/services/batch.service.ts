import { type BatchDto } from '@repo/shared';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class BatchService {
  /**
   * `POST batch/upsert` takes a `BatchDto` and nothing else.
   *
   * This used to post `{ batch, users }`, which the server's `forbidNonWhitelisted` pipe rejects —
   * neither key is a `BatchDto` property. Batch membership goes through
   * `MappingService.upsertUserBatchMapping`, which is the only route that accepts it.
   */
  upsertBatch = async (payload: BatchDto) => {
    const url = 'batch/upsert';
    const resData = await callAuthApi<BatchDto>(url, API.POST, payload);
    return resData;
  };

  /** `GET batch/all` returns the org's batches as a plain array. */
  getBatches = async () => {
    const url = 'batch/all';
    const resData = await callAuthApi<BatchDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new BatchService();
export default instance;
