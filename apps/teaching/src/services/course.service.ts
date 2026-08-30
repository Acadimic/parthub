import { ICourse, ICourseModule, IPlan } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class CourseService {
  upsertCourse = async (payload: ICourse) => {
    const url = `course/${Subdomain.TEACH}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertCourseAndPlans = async (payload: { course: ICourse; plans: IPlan[] }) => {
    const url = `course/${Subdomain.TEACH}/upsert/course/plans`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertCourseModule = async (payload: ICourseModule) => {
    const url = `course/${Subdomain.TEACH}/upsert/course/module`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getCourses = async () => {
    const url = `/course/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getCourseModulesByCourseId = async (courseId: string) => {
    const url = `/course/${Subdomain.TEACH}/course/modules/${courseId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new CourseService();
export default instance;
