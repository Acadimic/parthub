import { toPayload } from '@repo/ui/lib';
import { type ICompletedModule } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class CourseService {
  getCourses = async () => {
    return await callAuthApi('course/all', API.GET);
  };

  getCourseById = async (id: string) => {
    return await callAuthApi(`course/${id}`, API.GET);
  };

  getCoursesByStandardIds = async (standardIds: string[]) => {
    const url = 'course/standards';
    const resData = await callAuthApi(url, API.POST, standardIds);
    return resData;
  };

  getCourseModulesContentsByCourseId = async (courseId: string) => {
    const url = `course/course/modules/contents/${courseId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  upsertCompletedModule = async (payload: ICompletedModule) => {
    const url = 'course/completed/module/upsert';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  getCompletedModules = async () => {
    const url = 'course/completed/modules';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

export default new CourseService();
