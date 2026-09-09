import { type PlanDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class PlanService {
  getCoursePlans = async (courseId: string) => {
    const url = `plan/course/${courseId}`;
    const resData = await callAuthApi<PlanDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new PlanService();
export default instance;
