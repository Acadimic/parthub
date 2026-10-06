import { getTransformedBaseFields } from '@database/base.transform';
import { CourseService } from '@modules/course/course.service';
import { MaterialService } from '@modules/material/material.service';
import { ReactionService } from '@modules/reaction/reaction.service';
import { TestPaperService } from '@modules/test-paper/test-paper.service';
import { S3Service } from '@modules/s3/s3.service';
import { UserService } from '@modules/user/user.service';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentInboxStatus } from '@repo/shared/enums';
import { type ICourseCommentInbox, type ICourseCommentPage, type IDiscussionSource } from '@repo/shared/interfaces';
import { DISCUSSION_FILE_EXTENSIONS, DISCUSSION_LIMITS } from '@repo/shared/utils';
import { CommentInboxQueryDto, CourseCommentDto } from '@repo/shared/validations';
import { QueryFilter, Model, Types } from 'mongoose';
import { CourseComment, CourseCommentDocument } from './course-comment.schema';

@Injectable()
export class CourseCommentService {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.
  // eslint-disable-next-line max-params
  constructor(
    @InjectModel(CourseComment.name) private commentModel: Model<CourseCommentDocument>,
    private readonly courseService: CourseService,
    private readonly userService: UserService,
    private readonly reactionService: ReactionService,
    private readonly materialService: MaterialService,
    private readonly testPaperService: TestPaperService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Creates a comment, or edits or deletes the caller's own. Every lookup carries `createdBy`, so an
   * id that belongs to someone else becomes an insert and fails on the duplicate key rather than
   * overwriting their comment. `course`, `parent` and where it was written from are fixed when the
   * comment is created.
   */
  async upsert(org: Types.ObjectId, userId: Types.ObjectId, payload: CourseCommentDto): Promise<CourseCommentDto> {
    const course = await this.courseService.getVisibleCourse(org, payload.course);
    if (!course) throw new NotFoundException('Course not found.');
    if (!(await this.courseService.canDiscuss(org, course))) {
      throw new ForbiddenException('Enrol in this course to join its discussion.');
    }
    const { _id, attachments, _deleted } = payload;
    const body = payload.body.trim();
    if (!_deleted && !body && !attachments.length) {
      throw new BadRequestException('A comment needs text or an attachment.');
    }
    if (attachments.some((attachment) => !DISCUSSION_FILE_EXTENSIONS.includes(attachment.fileExtension))) {
      throw new BadRequestException('Only images and PDFs can be attached.');
    }
    if (attachments.some((attachment) => !this.s3Service.isOwnObjectUrl(attachment.url, String(org)))) {
      throw new BadRequestException('Attachments must be files uploaded with the comment.');
    }
    // The course is part of every lookup, so the access checked above is access to this comment's course.
    const isExisting = Boolean(
      await this.commentModel.exists({ _id, createdBy: userId, course: payload.course }).lean(),
    );
    const row = isExisting
      ? await this.update(userId, payload, body)
      : await this.insert(userId, payload, body, this.courseService.isCourseStaff(org, course));
    if (row.parent && row.isStaff) await this.refreshAnswered(row.parent);
    return this.getTransformed(row);
  }

  private async update(userId: Types.ObjectId, payload: CourseCommentDto, body: string) {
    const changes = payload._deleted
      ? { _deleted: true }
      : { body, attachments: payload.attachments, editedAt: new Date() };
    const row = await this.commentModel
      .findOneAndUpdate(
        { _id: payload._id, createdBy: userId, course: payload.course },
        { $set: changes },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<CourseCommentDocument>();
    if (!row) throw new NotFoundException('Comment not found.');
    return row;
  }

  private async insert(userId: Types.ObjectId, payload: CourseCommentDto, body: string, isStaff: boolean) {
    if (payload._deleted) throw new NotFoundException('Comment not found.');
    if (payload.parent) await this.assertTopLevel(payload.course, payload.parent);
    const row = await this.commentModel
      .findOneAndUpdate(
        { _id: payload._id, createdBy: userId },
        {
          $setOnInsert: {
            course: payload.course,
            parent: payload.parent ?? null,
            courseModule: payload.courseModule ?? null,
            material: payload.material ?? null,
            testPaper: payload.testPaper ?? null,
            body,
            attachments: payload.attachments,
            isStaff,
            _deleted: false,
          },
        },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<CourseCommentDocument>();
    if (!row) throw new NotFoundException('Comment not found.');
    return row;
  }

  /** Replies are one level deep, so a reply's parent must be a live top-level comment on the same course. */
  private async assertTopLevel(courseId: string, parentId: string): Promise<void> {
    const parent = await this.commentModel
      .exists({ _id: parentId, course: courseId, parent: null, _deleted: { $ne: true } })
      .lean();
    if (!parent) throw new BadRequestException('The comment you are replying to no longer exists.');
  }

  /**
   * Re-derives whether a thread is answered after a staff reply comes or goes. `timestamps: false`
   * because this is bookkeeping, not a change to the learner's comment.
   */
  private async refreshAnswered(parentId: Types.ObjectId): Promise<void> {
    const isAnswered = Boolean(
      await this.commentModel.exists({ parent: parentId, isStaff: true, _deleted: { $ne: true } }).lean(),
    );
    await this.commentModel.updateOne({ _id: parentId }, { $set: { isAnswered } }, { timestamps: false });
  }

  /**
   * Staff remove any comment on a course their organization owns. The row belongs to its author's
   * organization, so the write is scoped by the course's ownership, checked first, not by `org`.
   */
  async remove(org: Types.ObjectId, commentId: string): Promise<CourseCommentDto> {
    const comment = await this.commentModel
      .findOne({ _id: commentId, _deleted: { $ne: true } })
      .lean<CourseCommentDocument>();
    if (!comment) throw new NotFoundException('Comment not found.');
    const course = await this.courseService.getVisibleCourse(org, String(comment.course));
    if (!course || String(course.org) !== String(org)) {
      throw new ForbiddenException('Only staff of the course can remove its comments.');
    }
    const row = await this.commentModel
      .findOneAndUpdate(
        { _id: commentId, course: comment.course },
        { $set: { _deleted: true } },
        { returnDocument: 'after' },
      )
      .lean<CourseCommentDocument>();
    if (!row) throw new NotFoundException('Comment not found.');
    if (row.parent && row.isStaff) await this.refreshAnswered(row.parent);
    return this.getTransformed(row);
  }

  /**
   * A page of top-level comments newest first, each with every reply oldest first, and their
   * authors. Anyone who can see the course can read its discussion; a deleted comment takes its
   * replies out of view with it.
   */
  async getPage(
    org: Types.ObjectId,
    courseId: string,
    before: string | null,
  ): Promise<ICourseCommentPage<CourseCommentDto>> {
    const course = await this.courseService.getVisibleCourse(org, courseId);
    if (!course) throw new NotFoundException('Course not found.');
    return this.buildPage({ course: courseId }, before, course.org);
  }

  /** A teacher's inbox: comments across every course their organization owns, with what they cite. */
  async getInbox(org: Types.ObjectId, query: CommentInboxQueryDto): Promise<ICourseCommentInbox<CourseCommentDto>> {
    const courses = await this.courseService.getOrgCourseNames(org);
    const filter = this.getInboxFilter(courses, query);
    const page = await this.buildPage(filter, query.before ?? null, org);
    const cited = (key: 'material' | 'testPaper') => [
      ...new Set(page.comments.map((comment) => comment[key]).filter((id): id is string => Boolean(id))),
    ];
    const [materials, testPapers] = await Promise.all([
      this.materialService.getNamesByIds(org, cited('material')),
      this.testPaperService.getNamesByIds(org, cited('testPaper')),
    ]);
    return { ...page, sources: [...courses, ...materials, ...testPapers] };
  }

  /** How many threads on the organization's courses wait for a staff reply. */
  async getNeedsReplyCount(org: Types.ObjectId): Promise<number> {
    const courses = await this.courseService.getOrgCourseNames(org);
    return this.commentModel.countDocuments({
      ...this.getInboxFilter(courses, { status: CommentInboxStatus.NEEDS_REPLY }),
      parent: null,
      _deleted: { $ne: true },
    });
  }

  /** Which threads the inbox covers; the caller adds `parent: null` and the soft-delete guard. */
  private getInboxFilter(courses: IDiscussionSource[], query: CommentInboxQueryDto): QueryFilter<CourseComment> {
    const courseIds = courses.map((course) => course._id).filter((id) => !query.course || id === query.course);
    return {
      course: { $in: courseIds },
      // A thread staff started themselves, an announcement say, waits on nobody.
      ...(query.status === CommentInboxStatus.NEEDS_REPLY ? { isAnswered: { $ne: true }, isStaff: { $ne: true } } : {}),
      ...(query.material ? { material: query.material } : {}),
      ...(query.testPaper ? { testPaper: query.testPaper } : {}),
    };
  }

  /** Top-level comments matching `filter`, newest first, with their replies, authors and likes. */
  private async buildPage(
    filter: QueryFilter<CourseComment>,
    before: string | null,
    courseOrg: Types.ObjectId,
  ): Promise<ICourseCommentPage<CourseCommentDto>> {
    const topLevel = await this.commentModel
      .find({
        ...filter,
        parent: null,
        _deleted: { $ne: true },
        ...(before ? { createdAt: { $lt: new Date(before) } } : {}),
      })
      .sort({ createdAt: -1 })
      .limit(DISCUSSION_LIMITS.PAGE_SIZE + 1)
      .lean<CourseCommentDocument[]>();
    const hasMore = topLevel.length > DISCUSSION_LIMITS.PAGE_SIZE;
    const page = topLevel.slice(0, DISCUSSION_LIMITS.PAGE_SIZE);
    const replies = page.length
      ? await this.commentModel
          .find({ parent: { $in: page.map((row) => row._id) }, _deleted: { $ne: true } })
          .sort({ createdAt: 1 })
          .lean<CourseCommentDocument[]>()
      : [];
    const rows = [...page, ...replies];
    const authorIds = [...new Set(rows.map((row) => String(row.createdBy)))];
    const [authors, likes] = await Promise.all([
      this.userService.getDiscussionAuthors(authorIds, courseOrg),
      this.reactionService.getCountsByItems(rows.map((row) => row._id)),
    ]);
    return { comments: rows.map((row) => this.getTransformed(row)), authors, likes, hasMore };
  }

  private getTransformed(row: CourseCommentDocument): CourseCommentDto {
    return {
      ...getTransformedBaseFields(row),
      course: String(row.course),
      parent: row.parent ? String(row.parent) : null,
      courseModule: row.courseModule ? String(row.courseModule) : null,
      material: row.material ? String(row.material) : null,
      testPaper: row.testPaper ? String(row.testPaper) : null,
      body: row.body,
      attachments: row.attachments,
      isStaff: row.isStaff ?? false,
      isAnswered: row.isAnswered ?? false,
      editedAt: row.editedAt ? row.editedAt.toISOString() : null,
      _deleted: row._deleted,
    };
  }
}
