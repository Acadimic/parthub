import { toPayload } from '@repo/ui/lib';
import { type ICourse, type ICourseModule, type IPlan } from '@stores';
import { type CourseDto } from '@repo/shared';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class CourseService {
  upsertCourse = async (payload: ICourse) => {
    const url = 'course/upsert';
    const resData = await callAuthApi<CourseDto>(url, API.POST, toPayload(payload));
    return resData;
  };

  upsertCourseAndPlans = async (payload: { course: ICourse; plans: IPlan[] }) => {
    const url = 'course/upsert/course/plans';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  upsertCourseModule = async (payload: ICourseModule) => {
    const url = 'course/upsert/course/module';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  getCourses = async () => {
    const url = '/course/all';
    const resData = await callAuthApi<CourseDto[]>(url, API.GET);
    return resData;
  };

  getCourseModulesByCourseId = async (courseId: string) => {
    const url = `/course/course/modules/${courseId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new CourseService();
export default instance;
