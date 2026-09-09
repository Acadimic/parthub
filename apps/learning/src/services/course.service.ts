import {
  type ICompletedModule,
  type ICourse,
  type ICourseModule,
  type IMaterial,
  type IMeet,
  type ITestPaper,
} from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/**
 * `course/course/modules/:courseId` returns each module with its test papers, materials and meets
 * embedded rather than as ids. Declared here, at the boundary, because the store distributes the
 * collections and then keeps only ids.
 */
interface ICourseModuleContents extends Omit<ICourseModule, 'testPapers' | 'materials' | 'meets'> {
  testPapers: ITestPaper[];
  materials: IMaterial[];
  meets: IMeet[];
}

class CourseService {
  getCourses = async () => {
    return await callAuthApi('course/all', API.GET);
  };

  getCourseById = async (id: string) => {
    return await callAuthApi(`course/${id}`, API.GET);
  };

  getCoursesByStandardIds = async (standardIds: string[]) => {
    const url = 'course/standards';
    const resData = await callAuthApi<ICourse[]>(url, API.POST, standardIds);
    return resData;
  };

  getCourseModulesContentsByCourseId = async (courseId: string) => {
    const url = `course/course/modules/contents/${courseId}`;
    const resData = await callAuthApi<ICourseModuleContents[]>(url, API.GET);
    return resData;
  };

  upsertCompletedModule = async (payload: ICompletedModule) => {
    const url = 'course/completed/module/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getCompletedModules = async () => {
    const url = 'course/completed/modules';
    const resData = await callAuthApi<ICompletedModule[]>(url, API.GET);
    return resData;
  };
}

export default new CourseService();
