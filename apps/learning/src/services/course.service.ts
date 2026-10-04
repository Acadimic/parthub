import { type MeetDto, type PublishedCoursesResponse } from '@repo/shared/contracts';
import { type ICompletedModuleFields } from '@repo/shared/interfaces';
import { type ICourse, type ICourseModule, type IMaterial, type ITestPaper } from '@stores';
import { API } from '../enums';
import { callAuthApi, callUnAuthApi } from './http.service';

/** `course/published`, with the courses typed as the store holds them. */
interface IPublishedCoursesResponse extends Omit<PublishedCoursesResponse, 'courses'> {
  courses: ICourse[];
}

/**
 * `course/course/modules/:courseId` returns each module with its test papers, materials and meets
 * embedded rather than as ids. Declared here, at the boundary, because the store distributes the
 * collections and then keeps only ids.
 */
export interface ICourseModuleContents extends Omit<ICourseModule, 'testPapers' | 'materials' | 'meets'> {
  testPapers: ITestPaper[];
  materials: IMaterial[];
  meets: MeetDto[];
}

class CourseService {
  getCourses = async () => {
    return await callAuthApi('course/all', API.GET);
  };

  getCourseById = async (id: string) => {
    return await callAuthApi(`course/${id}`, API.GET);
  };

  /**
   * The public catalogue: published courses from every organization. Needs no session; `signed`
   * also asks for the covers' signed URLs, for a visitor who has none.
   */
  getPublishedCourses = async ({ signed }: { signed: boolean }) => {
    const url = `course/published${signed ? '?signed=true' : ''}`;
    const resData = await callUnAuthApi<IPublishedCoursesResponse>(url, API.GET);
    return resData;
  };

  getCourseModulesContentsByCourseId = async (courseId: string) => {
    const url = `course/course/modules/contents/${courseId}`;
    const resData = await callAuthApi<ICourseModuleContents[]>(url, API.GET);
    return resData;
  };

  /** One module with its lesson bodies, for printing that module without the whole course. */
  getCourseModuleContents = async (courseId: string, moduleId: string) =>
    callAuthApi<ICourseModuleContents>(`course/course/module/contents/${courseId}/${moduleId}`, API.GET);

  /** The syllabus with no lesson bodies or files — a fraction of the contents payload. */
  getCourseModulesOutlineByCourseId = async (courseId: string) =>
    callAuthApi<ICourseModuleContents[]>(`course/course/modules/outline/${courseId}`, API.GET);

  /** The same syllabus for a visitor with no session; only a published course answers. */
  getPublishedCourseOutline = async (courseId: string) =>
    callUnAuthApi<ICourseModuleContents[]>(`course/published/outline/${courseId}`, API.GET);

  upsertCompletedModule = async (payload: ICompletedModuleFields) => {
    const url = 'course/completed/module/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getCompletedModules = async () => {
    const url = 'course/completed/modules';
    const resData = await callAuthApi<ICompletedModuleFields[]>(url, API.GET);
    return resData;
  };
}

export default new CourseService();
