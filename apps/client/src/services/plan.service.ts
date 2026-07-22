import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class PlanService {
  getCoursePlans = async (courseId: string) => {
    const url = `plan/${Subdomain.LEARN}/course/${courseId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new PlanService();
export default instance;
