import { type ICourseModule } from '@stores';
import { type CourseDto, type PlanDto } from '@repo/shared/contracts';
import { type ICourseModuleFields } from '@repo/shared/interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class CourseService {
  upsertCourse = async (payload: CourseDto) => {
    const url = 'course/upsert';
    const resData = await callAuthApi<CourseDto>(url, API.POST, payload);
    return resData;
  };

  upsertCourseAndPlans = async (payload: { course: CourseDto; plans: PlanDto[] }) => {
    const url = 'course/upsert/course/plans';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertCourseModule = async (payload: ICourseModule) => {
    const url = 'course/upsert/course/module';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getCourses = async () => {
    const url = '/course/all';
    const resData = await callAuthApi<CourseDto[]>(url, API.GET);
    return resData;
  };

  getCourseModulesByCourseId = async (courseId: string) => {
    const url = `/course/course/modules/${courseId}`;
    const resData = await callAuthApi<ICourseModuleFields[]>(url, API.GET);
    return resData;
  };
}

const instance = new CourseService();
export default instance;
