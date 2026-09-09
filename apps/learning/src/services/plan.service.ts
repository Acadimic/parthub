import { type IPlan } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class PlanService {
  getCoursePlans = async (courseId: string) => {
    const url = `plan/course/${courseId}`;
    const resData = await callAuthApi<IPlan[]>(url, API.GET);
    return resData;
  };
}

const instance = new PlanService();
export default instance;
