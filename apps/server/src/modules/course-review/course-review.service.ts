import { getTransformedBaseFields } from '@database/base.transform';
import { CourseDocument } from '@modules/course/course.schema';
import { CourseService } from '@modules/course/course.service';
import { ReactionService } from '@modules/reaction/reaction.service';
import { UserService } from '@modules/user/user.service';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type ICourseRating, type ICourseReviewPage, type ICourseReviewSummary } from '@repo/shared/interfaces';
import { DISCUSSION_LIMITS } from '@repo/shared/utils';
import { CourseReviewDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { CourseReview, CourseReviewDocument } from './course-review.schema';

@Injectable()
export class CourseReviewService {
  constructor(
    @InjectModel(CourseReview.name) private reviewModel: Model<CourseReviewDocument>,
    private readonly courseService: CourseService,
    private readonly userService: UserService,
    private readonly reactionService: ReactionService,
  ) {}

  private async getVisibleCourse(org: Types.ObjectId, courseId: string): Promise<CourseDocument> {
    const course = await this.courseService.getVisibleCourse(org, courseId);
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }

  /**
   * Writes the caller's one review of a course, found by the learner and course rather than by
   * `_id`: a client that has not loaded its earlier review sends a fresh id, and applying that to the
   * existing row would be an immutable-field update.
   */
  async upsert(org: Types.ObjectId, userId: Types.ObjectId, payload: CourseReviewDto): Promise<CourseReviewDto> {
    const course = await this.getVisibleCourse(org, payload.course);
    if (!(await this.courseService.canDiscuss(org, course))) {
      throw new ForbiddenException('Enrol in this course to review it.');
    }
    const { _id, course: courseId, rating, body, _deleted } = payload;
    const row = await this.reviewModel
      .findOneAndUpdate(
        { createdBy: userId, course: courseId, _deleted: { $ne: true } },
        { $set: { rating, body: body.trim(), _deleted: _deleted ?? false }, $setOnInsert: { _id } },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<CourseReviewDocument>();
    return this.getTransformed(row);
  }

  async getPage(
    org: Types.ObjectId,
    courseId: string,
    before: string | null,
  ): Promise<ICourseReviewPage<CourseReviewDto>> {
    return this.buildPage(await this.getVisibleCourse(org, courseId), before);
  }

  /** A published course's reviews, for a visitor to its public page. */
  async getPublicPage(courseId: string, before: string | null): Promise<ICourseReviewPage<CourseReviewDto>> {
    return this.buildPage(await this.getPublicCourse(courseId), before);
  }

  async getSummary(
    org: Types.ObjectId,
    userId: Types.ObjectId,
    courseId: string,
  ): Promise<ICourseReviewSummary<CourseReviewDto>> {
    const course = await this.getVisibleCourse(org, courseId);
    const [rating, mine] = await Promise.all([
      this.buildRating(course),
      this.reviewModel
        .findOne({ course: courseId, createdBy: userId, _deleted: { $ne: true } })
        .lean<CourseReviewDocument>(),
    ]);
    return { ...rating, mine: mine ? this.getTransformed(mine) : null };
  }

  /** A published course's rating, for a visitor to its public page. */
  async getPublicRating(courseId: string): Promise<ICourseRating> {
    return this.buildRating(await this.getPublicCourse(courseId));
  }

  private async getPublicCourse(courseId: string): Promise<CourseDocument> {
    const course = await this.courseService.findPublicCourse(courseId);
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }

  private async buildPage(course: CourseDocument, before: string | null): Promise<ICourseReviewPage<CourseReviewDto>> {
    const rows = await this.reviewModel
      .find({
        course: course._id,
        _deleted: { $ne: true },
        ...(before ? { createdAt: { $lt: new Date(before) } } : {}),
      })
      .sort({ createdAt: -1 })
      .limit(DISCUSSION_LIMITS.PAGE_SIZE + 1)
      .lean<CourseReviewDocument[]>();
    const page = rows.slice(0, DISCUSSION_LIMITS.PAGE_SIZE);
    const authorIds = [...new Set(page.map((row) => String(row.createdBy)))];
    return {
      reviews: page.map((row) => this.getTransformed(row)),
      authors: await this.userService.getDiscussionAuthors(authorIds, course.org),
      likes: await this.reactionService.getCountsByItems(page.map((row) => row._id)),
      hasMore: rows.length > DISCUSSION_LIMITS.PAGE_SIZE,
    };
  }

  private async buildRating(course: CourseDocument): Promise<ICourseRating> {
    const groups = await this.reviewModel.aggregate<{ _id: number; count: number }>([
      { $match: { course: course._id, _deleted: { $ne: true } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const distribution = [1, 2, 3, 4, 5].map((star) => groups.find((group) => group._id === star)?.count ?? 0);
    const count = distribution.reduce((sum, value) => sum + value, 0);
    const total = distribution.reduce((sum, value, index) => sum + value * (index + 1), 0);
    return { average: count ? Math.round((total / count) * 10) / 10 : 0, count, distribution };
  }

  private getTransformed(row: CourseReviewDocument): CourseReviewDto {
    return {
      ...getTransformedBaseFields(row),
      course: String(row.course),
      rating: row.rating,
      body: row.body,
      _deleted: row._deleted,
    };
  }
}
