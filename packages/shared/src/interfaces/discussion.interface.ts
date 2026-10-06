/** The name and picture shown beside a comment or review; served alongside a page, keyed by user id. */
export interface IDiscussionAuthor {
  _id: string;
  name: string;
  avatar: string | null;
  /** Staff of the organization that owns the course, shown with a "Teacher" badge. */
  isTeacher: boolean;
}

/**
 * One page of a course's discussion: top-level comments newest first, each with all of its replies,
 * and the author of every row on the page.
 */
export interface ICourseCommentPage<TComment = unknown> {
  comments: TComment[];
  authors: IDiscussionAuthor[];
  /** Likes per comment id; a comment nobody has liked is absent. */
  likes: Record<string, number>;
  hasMore: boolean;
}

/** One page of a course's reviews, newest first. */
export interface ICourseReviewPage<TReview = unknown> {
  reviews: TReview[];
  authors: IDiscussionAuthor[];
  /** Likes per review id; a review nobody has liked is absent. */
  likes: Record<string, number>;
  hasMore: boolean;
}

/** A course's rating at a glance: what a visitor to its public page sees. */
export interface ICourseRating {
  average: number;
  count: number;
  /** How many reviews gave each star, index 0 for one star through index 4 for five. */
  distribution: number[];
}

/** The rating plus the caller's own review, so the form can open on it. */
export interface ICourseReviewSummary<TReview = unknown> extends ICourseRating {
  mine: TReview | null;
}

/** The name of something a comment points at — its course, lesson or test paper — keyed by id. */
export interface IDiscussionSource {
  _id: string;
  name: string;
}

/** A page of a teacher's inbox: a comment page plus the names of the courses and lessons it cites. */
export interface ICourseCommentInbox<TComment = unknown> extends ICourseCommentPage<TComment> {
  sources: IDiscussionSource[];
}
