import { type CourseCommentDto, type CourseReviewDto } from '@repo/shared/contracts';
import {
  type ICourseCommentPage,
  type ICourseRating,
  type ICourseReviewPage,
  type ICourseReviewSummary,
} from '@repo/shared/interfaces';
import { API } from '../enums';
import { callAuthApi, callUnAuthApi } from './http.service';

/** A course's comments and reviews. `before` is the oldest row already shown, for the next page. */
class DiscussionService {
  getComments = async (courseId: string, before: string | null) => {
    const url = `course-comment/course/${courseId}`;
    return callAuthApi<ICourseCommentPage<CourseCommentDto>>(url, API.GET, before ? { before } : null);
  };

  upsertComment = async (payload: CourseCommentDto) => {
    return callAuthApi<CourseCommentDto>('course-comment/upsert', API.POST, payload);
  };

  getReviews = async (courseId: string, before: string | null) => {
    const url = `course-review/course/${courseId}`;
    return callAuthApi<ICourseReviewPage<CourseReviewDto>>(url, API.GET, before ? { before } : null);
  };

  getReviewSummary = async (courseId: string) => {
    return callAuthApi<ICourseReviewSummary<CourseReviewDto>>(`course-review/summary/${courseId}`, API.GET);
  };

  /** A published course's reviews and rating, for its public page; no session needed. */
  getPublishedReviews = async (courseId: string, before: string | null) => {
    const url = `course-review/published/${courseId}`;
    return callUnAuthApi<ICourseReviewPage<CourseReviewDto>>(url, API.GET, before ? { before } : null);
  };

  getPublishedRating = async (courseId: string) => {
    return callUnAuthApi<ICourseRating>(`course-review/published/summary/${courseId}`, API.GET);
  };

  upsertReview = async (payload: CourseReviewDto) => {
    return callAuthApi<CourseReviewDto>('course-review/upsert', API.POST, payload);
  };
}

const instance = new DiscussionService();
export default instance;
