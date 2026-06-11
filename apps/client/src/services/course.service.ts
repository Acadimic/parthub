import { API } from '../enums';
import { callAuthApi } from './http.service';

class CourseService {
  getCourses = async () => {
    return await callAuthApi('course', API.GET);
  };

  getCourseById = async (id: string) => {
    return await callAuthApi(`course/${id}`, API.GET);
  };
}

export default new CourseService();
