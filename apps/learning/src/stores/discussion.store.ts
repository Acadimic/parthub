import { type CourseCommentDto, type CourseReviewDto } from '@repo/shared/contracts';
import { type ICourseRating, type IDiscussionAuthor } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { DiscussionService } from '../services';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

type DiscussionFetch = 'comments' | 'moreComments' | 'reviews' | 'moreReviews' | 'rating';

/**
 * Who the reviews are loaded for: a signed-in learner, who also gets their own review back, or a
 * visitor to the public course page, who reads them with no session.
 */
type ReviewAudience = 'member' | 'public';

export interface IDiscussionState extends IRequestSlice<DiscussionFetch> {
  /** The course the maps below belong to; opening another course starts them afresh. */
  courseId: string | null;
  commentMap: Record<string, CourseCommentDto>;
  reviewMap: Record<string, CourseReviewDto>;
  authorMap: Record<string, IDiscussionAuthor>;
  /** Likes per comment or review id, from the pages loaded and nudged by a like or unlike. */
  likeMap: Record<string, number>;
  rating: ICourseRating | null;
  /** The signed-in learner's own review of the course, or null when they have not written one. */
  myReview: CourseReviewDto | null;
  reviewAudience: ReviewAudience;
  hasMoreComments: boolean;
  hasMoreReviews: boolean;

  getTopLevelComments: () => CourseCommentDto[];
  getReplies: (parentId: string) => CourseCommentDto[];
  getReviews: () => CourseReviewDto[];
  getAuthor: (userId: string) => IDiscussionAuthor | undefined;
  getLikes: (itemId: string) => number;
  adjustLikes: (itemId: string, delta: number) => void;

  loadComments: (courseId: string) => Promise<void>;
  loadMoreComments: () => Promise<void>;
  /** Posts a new, edited or deleted comment; resolves to whether the server accepted it. */
  saveComment: (comment: CourseCommentDto) => Promise<boolean>;
  loadReviews: (courseId: string) => Promise<void>;
  /** Reviews and rating for a visitor to the public course page. */
  loadPublishedReviews: (courseId: string) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  /** Posts the caller's review, or deletes it, and refreshes the rating it changes. */
  saveReview: (review: CourseReviewDto) => Promise<boolean>;
  addAuthors: (authors: IDiscussionAuthor[]) => void;
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

/** The oldest top-level row loaded: the cursor for the next page. */
const getOldest = (rows: { createdAt?: string }[]): string | null =>
  rows.reduce<string | null>((oldest, row) => {
    if (!row.createdAt) return oldest;
    return !oldest || row.createdAt < oldest ? row.createdAt : oldest;
  }, null);

const withoutKey = <T>(map: Record<string, T>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(map).filter(([id]) => id !== key));

export const useDiscussionStore = create<IDiscussionState>()((set, get) => {
  /** Clears what another course left behind before loading this one's. */
  const switchCourse = (courseId: string) => {
    if (get().courseId === courseId) return;
    set({
      courseId,
      commentMap: {},
      reviewMap: {},
      rating: null,
      myReview: null,
      hasMoreComments: false,
      hasMoreReviews: false,
    });
  };

  const fetchComments = async (courseId: string, before: string | null) => {
    const { data } = await DiscussionService.getComments(courseId, before);
    if (!data || get().courseId !== courseId) return;
    get().addAuthors(data.authors);
    set((state) => ({
      likeMap: { ...state.likeMap, ...getPageLikes(data.comments, data.likes) },
      commentMap: { ...(before ? state.commentMap : {}), ...keyById(data.comments) },
      hasMoreComments: data.hasMore,
    }));
  };

  // Each fetch is for one course and one audience; an answer for the other audience — a visitor's
  // load that lands after the learner signed in — is dropped rather than overwriting theirs.
  const isCurrent = (courseId: string, audience: ReviewAudience) =>
    get().courseId === courseId && get().reviewAudience === audience;

  const fetchReviews = async (courseId: string, before: string | null) => {
    const audience = get().reviewAudience;
    const { data } =
      audience === 'public'
        ? await DiscussionService.getPublishedReviews(courseId, before)
        : await DiscussionService.getReviews(courseId, before);
    if (!data || !isCurrent(courseId, audience)) return;
    get().addAuthors(data.authors);
    set((state) => ({
      likeMap: { ...state.likeMap, ...getPageLikes(data.reviews, data.likes) },
      reviewMap: { ...(before ? state.reviewMap : {}), ...keyById(data.reviews) },
      hasMoreReviews: data.hasMore,
    }));
  };

  const fetchSummary = async (courseId: string) => {
    const { data } = await DiscussionService.getReviewSummary(courseId);
    if (!data || !isCurrent(courseId, 'member')) return;
    const { mine, ...rating } = data;
    set({ rating, myReview: mine });
  };

  const fetchPublishedRating = async (courseId: string) => {
    const { data } = await DiscussionService.getPublishedRating(courseId);
    if (data && isCurrent(courseId, 'public')) set({ rating: data });
  };

  return {
    courseId: null,
    commentMap: {},
    reviewMap: {},
    authorMap: {},
    likeMap: {},
    rating: null,
    myReview: null,
    reviewAudience: 'member',
    hasMoreComments: false,
    hasMoreReviews: false,
    ...createRequestSlice(['comments', 'moreComments', 'reviews', 'moreReviews', 'rating'], set, get),

    getTopLevelComments: () =>
      Object.values(get().commentMap)
        .filter((comment) => !comment.parent)
        .sort(byNewest),

    getReplies: (parentId) =>
      Object.values(get().commentMap)
        .filter((comment) => comment.parent === parentId)
        .sort((a, b) => byNewest(b, a)),

    getReviews: () => Object.values(get().reviewMap).sort(byNewest),

    getAuthor: (userId) => get().authorMap[userId],

    getLikes: (itemId) => get().likeMap[itemId] ?? 0,

    adjustLikes: (itemId, delta) =>
      set((state) => ({ likeMap: { ...state.likeMap, [itemId]: Math.max(0, (state.likeMap[itemId] ?? 0) + delta) } })),

    addAuthors: (authors) => set((state) => ({ authorMap: { ...state.authorMap, ...keyById(authors) } })),

    loadComments: (courseId) => {
      switchCourse(courseId);
      return get().run('comments', () => fetchComments(courseId, null));
    },

    loadMoreComments: () => {
      const { courseId } = get();
      if (!courseId) return Promise.resolve();
      return get().run('moreComments', () => fetchComments(courseId, getOldest(get().getTopLevelComments())));
    },

    saveComment: async (comment) => {
      const { data } = await DiscussionService.upsertComment(comment).catch(() => ({ data: undefined }));
      if (!data) return false;
      set((state) => {
        if (!data._deleted) return { commentMap: { ...state.commentMap, [data._id]: data } };
        // A deleted comment takes its replies out of view with it, as the server does.
        const commentMap = Object.fromEntries(
          Object.entries(state.commentMap).filter(([id, row]) => id !== data._id && row.parent !== data._id),
        );
        return { commentMap };
      });
      return true;
    },

    loadReviews: (courseId) => {
      switchCourse(courseId);
      set({ reviewAudience: 'member' });
      return Promise.all([
        get().run('reviews', () => fetchReviews(courseId, null)),
        get().run('rating', () => fetchSummary(courseId)),
      ]).then(() => undefined);
    },

    loadPublishedReviews: (courseId) => {
      switchCourse(courseId);
      set({ reviewAudience: 'public', myReview: null });
      return Promise.all([
        get().run('reviews', () => fetchReviews(courseId, null)),
        get().run('rating', () => fetchPublishedRating(courseId)),
      ]).then(() => undefined);
    },

    loadMoreReviews: () => {
      const { courseId } = get();
      if (!courseId) return Promise.resolve();
      return get().run('moreReviews', () => fetchReviews(courseId, getOldest(get().getReviews())));
    },

    saveReview: async (review) => {
      const { data } = await DiscussionService.upsertReview(review).catch(() => ({ data: undefined }));
      if (!data) return false;
      set((state) => ({
        reviewMap: data._deleted ? withoutKey(state.reviewMap, data._id) : { ...state.reviewMap, [data._id]: data },
      }));
      await fetchSummary(data.course);
      return true;
    },
  };
});

/** The store's lookups, subscribed to its state. */
export const useDiscussionLookups = (): IDiscussionState => useDiscussionStore(useShallow((state) => state));
