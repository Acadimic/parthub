import { type CourseDto, type CourseModuleDto, type PlanDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class CourseService {
  upsertCourse = async (payload: CourseDto) => {
    const url = 'course/upsert';
    const resData = await callAuthApi<CourseDto>(url, API.POST, payload);
    return resData;
  };

  /** The pair travels as one body: a course with no plan is not sellable, so neither is saved alone. */
  upsertCourseAndPlans = async (payload: { course: CourseDto; plans: PlanDto[] }) => {
    const url = 'course/upsert/course/plans';
    const resData = await callAuthApi<{ course: CourseDto; plans: PlanDto[] }>(url, API.POST, payload);
    return resData;
  };

  upsertCourseModule = async (payload: CourseModuleDto) => {
    const url = 'course/upsert/course/module';
    const resData = await callAuthApi<CourseModuleDto>(url, API.POST, payload);
    return resData;
  };

  getCourses = async () => {
    const url = 'course/all';
    const resData = await callAuthApi<CourseDto[]>(url, API.GET);
    return resData;
  };

  getCourseById = async (courseId: string) => {
    const url = `course/${courseId}`;
    const resData = await callAuthApi<CourseDto>(url, API.GET);
    return resData;
  };

  getCourseModulesByCourseId = async (courseId: string) => {
    const url = `course/course/modules/${courseId}`;
    const resData = await callAuthApi<CourseModuleDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new CourseService();
export default instance;
