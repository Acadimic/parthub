import { type CommentInboxQueryDto, type CourseCommentDto, type CourseReviewDto } from '@repo/shared/contracts';
import { type ICourseRating, type IDiscussionAuthor, type IDiscussionSource } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { DiscussionService } from '../services';

type DiscussionFetch = 'comments' | 'moreComments' | 'needsReplyCount' | 'reviews' | 'moreReviews' | 'rating';

/** Which comments the store holds: the inbox under some filters, or one course's discussion. */
export type CommentScope =
  { kind: 'inbox'; filters: Omit<CommentInboxQueryDto, 'before'> } | { kind: 'course'; courseId: string };

export interface IDiscussionState extends IRequestSlice<DiscussionFetch> {
  scope: CommentScope | null;
  commentMap: Record<string, CourseCommentDto>;
  authorMap: Record<string, IDiscussionAuthor>;
  likeMap: Record<string, number>;
  /** Names of the courses, lessons and test papers the inbox's comments cite. */
  sourceMap: Record<string, IDiscussionSource>;
  hasMoreComments: boolean;
  needsReplyCount: number;
  reviewCourseId: string | null;
  reviewMap: Record<string, CourseReviewDto>;
  rating: ICourseRating | null;
  hasMoreReviews: boolean;

  getTopLevelComments: () => CourseCommentDto[];
  getReplies: (parentId: string) => CourseCommentDto[];
  getReviews: () => CourseReviewDto[];

  loadComments: (scope: CommentScope) => Promise<void>;
  loadMoreComments: () => Promise<void>;
  loadNeedsReplyCount: () => Promise<void>;
  /** Posts a reply or an edit of the teacher's own comment; resolves to whether it was saved. */
  saveComment: (comment: CourseCommentDto) => Promise<boolean>;
  /** Removes anyone's comment, and its replies with it. */
  removeComment: (comment: CourseCommentDto) => Promise<boolean>;
  loadReviews: (courseId: string) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
}

/**
 * A page's like counts for every row it carries. The server leaves out rows nobody likes, so a row
 * unliked since the last load is written back as 0 rather than keeping its old count.
 */
const getPageLikes = (rows: { _id: string }[], likes: Record<string, number>): Record<string, number> =>
  Object.fromEntries(rows.map((row) => [row._id, likes[row._id] ?? 0]));

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  Object.fromEntries(rows.map((row) => [row._id, row]));

const byNewest = (a: { createdAt?: string }, b: { createdAt?: string }) =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

const getOldest = (rows: { createdAt?: string }[]): string | null =>
  rows.reduce<string | null>((oldest, row) => {
    if (!row.createdAt) return oldest;
    return !oldest || row.createdAt < oldest ? row.createdAt : oldest;
  }, null);

const isSameScope = (a: CommentScope | null, b: CommentScope) => JSON.stringify(a) === JSON.stringify(b);

export const useDiscussionStore = create<IDiscussionState>()((set, get) => {
  const fetchPage = async (scope: CommentScope, before: string | null) => {
    if (scope.kind === 'course') {
      const { data } = await DiscussionService.getComments(scope.courseId, before);
      return data ? { ...data, sources: [] } : undefined;
    }
    const { data } = await DiscussionService.getInbox({ ...scope.filters, ...(before ? { before } : {}) });
    return data;
  };

  const fetchComments = async (scope: CommentScope, before: string | null) => {
    const data = await fetchPage(scope, before);
    if (!data || !isSameScope(get().scope, scope)) return;
    set((state) => ({
      commentMap: { ...(before ? state.commentMap : {}), ...keyById(data.comments) },
      authorMap: { ...state.authorMap, ...keyById(data.authors) },
      likeMap: { ...state.likeMap, ...getPageLikes(data.comments, data.likes) },
      sourceMap: { ...state.sourceMap, ...keyById(data.sources) },
      hasMoreComments: data.hasMore,
    }));
  };

  const fetchReviews = async (courseId: string, before: string | null) => {
    const { data } = await DiscussionService.getReviews(courseId, before);
    if (!data || get().reviewCourseId !== courseId) return;
    set((state) => ({
      reviewMap: { ...(before ? state.reviewMap : {}), ...keyById(data.reviews) },
      authorMap: { ...state.authorMap, ...keyById(data.authors) },
      likeMap: { ...state.likeMap, ...getPageLikes(data.reviews, data.likes) },
      hasMoreReviews: data.hasMore,
    }));
  };

  /** A staff reply came or went: re-derive the thread's answered state as the server does. */
  const refreshAnswered = (parentId: string) =>
    set((state) => {
      const parent = state.commentMap[parentId];
      if (!parent) return {};
      const isAnswered = Object.values(state.commentMap).some((row) => row.parent === parentId && row.isStaff);
      return { commentMap: { ...state.commentMap, [parentId]: { ...parent, isAnswered } } };
    });

  return {
    scope: null,
    commentMap: {},
    authorMap: {},
    likeMap: {},
    sourceMap: {},
    hasMoreComments: false,
    needsReplyCount: 0,
    reviewCourseId: null,
    reviewMap: {},
    rating: null,
    hasMoreReviews: false,
    ...createRequestSlice(
      ['comments', 'moreComments', 'needsReplyCount', 'reviews', 'moreReviews', 'rating'],
      set,
      get,
    ),

    getTopLevelComments: () =>
      Object.values(get().commentMap)
        .filter((comment) => !comment.parent)
        .sort(byNewest),

    getReplies: (parentId) =>
      Object.values(get().commentMap)
        .filter((comment) => comment.parent === parentId)
        .sort((a, b) => byNewest(b, a)),

    getReviews: () => Object.values(get().reviewMap).sort(byNewest),

    loadComments: (scope) => {
      if (!isSameScope(get().scope, scope)) set({ scope, commentMap: {}, hasMoreComments: false });
      return get().run('comments', () => fetchComments(scope, null));
    },

    loadMoreComments: () => {
      const { scope } = get();
      if (!scope) return Promise.resolve();
      return get().run('moreComments', () => fetchComments(scope, getOldest(get().getTopLevelComments())));
    },

    loadNeedsReplyCount: () =>
      get().run('needsReplyCount', async () => {
        const { data } = await DiscussionService.getNeedsReplyCount();
        set({ needsReplyCount: data ?? 0 });
      }),

    saveComment: async (comment) => {
      const { data } = await DiscussionService.upsertComment(comment).catch(() => ({ data: undefined }));
      if (!data) return false;
      set((state) => ({ commentMap: { ...state.commentMap, [data._id]: data } }));
      if (data.parent) refreshAnswered(data.parent);
      void get().loadNeedsReplyCount();
      return true;
    },

    removeComment: async (comment) => {
      const { data } = await DiscussionService.removeComment(comment._id).catch(() => ({ data: undefined }));
      if (!data) return false;
      set((state) => ({
        commentMap: Object.fromEntries(
          Object.entries(state.commentMap).filter(([id, row]) => id !== comment._id && row.parent !== comment._id),
        ),
      }));
      if (comment.parent) refreshAnswered(comment.parent);
      void get().loadNeedsReplyCount();
      return true;
    },

    loadReviews: (courseId) => {
      if (get().reviewCourseId !== courseId) {
        set({ reviewCourseId: courseId, reviewMap: {}, rating: null, hasMoreReviews: false });
      }
      return Promise.all([
        get().run('reviews', () => fetchReviews(courseId, null)),
        get().run('rating', async () => {
          const { data } = await DiscussionService.getReviewSummary(courseId);
          if (!data || get().reviewCourseId !== courseId) return;
          const { mine, ...rating } = data;
          set({ rating });
        }),
      ]).then(() => undefined);
    },

    loadMoreReviews: () => {
      const { reviewCourseId } = get();
      if (!reviewCourseId) return Promise.resolve();
      return get().run('moreReviews', () => fetchReviews(reviewCourseId, getOldest(get().getReviews())));
    },
  };
});

/** The store's lookups, subscribed to its state. */
export const useDiscussionLookups = (): IDiscussionState => useDiscussionStore(useShallow((state) => state));
