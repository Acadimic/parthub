import { type StudentStandardMappingDto, type UserBatchMappingDto } from '@repo/shared';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MappingService {
  getOrgStudentStandardMappings = async () => {
    const url = 'mapping/student-standard/all';
    const resData = await callAuthApi<StudentStandardMappingDto[]>(url, API.GET);
    return resData;
  };

  getOrgUserBatchMappings = async () => {
    const url = 'mapping/user-batch/all';
    const resData = await callAuthApi<UserBatchMappingDto[]>(url, API.GET);
    return resData;
  };

  /**
   * Adds or removes one user's membership of one batch.
   *
   * The server upserts on `{ user, batch, org }`, so sending the pair again is idempotent, and
   * sending `_deleted: true` removes the membership — every read filters deleted rows out.
   */
  upsertUserBatchMapping = async (payload: Partial<UserBatchMappingDto>) => {
    const url = 'mapping/user-batch/upsert';
    const resData = await callAuthApi<UserBatchMappingDto>(url, API.POST, payload);
    return resData;
  };
}

const instance = new MappingService();
export default instance;
