import { type PlanDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi, callUnAuthApi } from './http.service';

class PlanService {
  getCoursePlans = async (courseId: string) => {
    // `plan/course/:id` is teach-only and org-scoped; this one answers for any visible course.
    const url = `course/plans/${courseId}`;
    const resData = await callAuthApi<PlanDto[]>(url, API.GET);
    return resData;
  };

  /** The same plans for a visitor with no session; only a published course answers. */
  getPublishedCoursePlans = async (courseId: string) =>
    callUnAuthApi<PlanDto[]>(`course/published/plans/${courseId}`, API.GET);
}

const instance = new PlanService();
export default instance;
