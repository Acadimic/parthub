import { type PlanDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class PlanService {
  getCoursePlans = async (courseId: string) => {
    // `plan/course/:id` is teach-only and org-scoped; this one answers for any visible course.
    const url = `course/plans/${courseId}`;
    const resData = await callAuthApi<PlanDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new PlanService();
export default instance;
