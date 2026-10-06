import { type CommentInboxQueryDto, type CourseCommentDto, type CourseReviewDto } from '@repo/shared/contracts';
import {
  type ICourseCommentInbox,
  type ICourseCommentPage,
  type ICourseReviewPage,
  type ICourseReviewSummary,
} from '@repo/shared/interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/** Course discussions as staff see them: one course's, or the inbox across every course. */
class DiscussionService {
  getInbox = async (query: CommentInboxQueryDto) => {
    return callAuthApi<ICourseCommentInbox<CourseCommentDto>>('course-comment/inbox', API.GET, query);
  };

  getNeedsReplyCount = async () => {
    return callAuthApi<number>('course-comment/inbox/count', API.GET);
  };

  getComments = async (courseId: string, before: string | null) => {
    const url = `course-comment/course/${courseId}`;
    return callAuthApi<ICourseCommentPage<CourseCommentDto>>(url, API.GET, before ? { before } : null);
  };

  upsertComment = async (payload: CourseCommentDto) => {
    return callAuthApi<CourseCommentDto>('course-comment/upsert', API.POST, payload);
  };

  /** Removes anyone's comment on one of the organization's courses. */
  removeComment = async (commentId: string) => {
    return callAuthApi<CourseCommentDto>(`course-comment/remove/${commentId}`, API.POST);
  };

  getReviews = async (courseId: string, before: string | null) => {
    const url = `course-review/course/${courseId}`;
    return callAuthApi<ICourseReviewPage<CourseReviewDto>>(url, API.GET, before ? { before } : null);
  };

  getReviewSummary = async (courseId: string) => {
    return callAuthApi<ICourseReviewSummary<CourseReviewDto>>(`course-review/summary/${courseId}`, API.GET);
  };
}

const instance = new DiscussionService();
export default instance;
