import { Permissions } from '@decorators/permissions.decorator';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { CommentInboxQueryDto, CourseCommentDto, DiscussionPageQueryDto } from '@repo/shared/validations';
import { RequestContextService } from '../../context/request-context.service';
import { CourseCommentService } from './course-comment.service';

@Controller('course-comment')
export class CourseCommentController {
  constructor(
    private readonly courseCommentService: CourseCommentService,
    private readonly requestContextService: RequestContextService,
  ) {}

  /** Learners post from the learning app; the course's own staff reply from the teaching app. */
  @Post('upsert')
  @Subdomains(Subdomain.LEARN, Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_DISCUSSION)
  async upsertComment(@Body() payload: CourseCommentDto) {
    const { requestContextService } = this;
    return this.courseCommentService.upsert(
      requestContextService.getOrgId(),
      requestContextService.getUserId(),
      payload,
    );
  }

  @Get('course/:courseId')
  @Permissions(PermissionItem.VIEW_COURSE)
  async getComments(@Param('courseId') courseId: string, @Query() query: DiscussionPageQueryDto) {
    return this.courseCommentService.getPage(this.requestContextService.getOrgId(), courseId, query.before ?? null);
  }

  /** A teacher's inbox across every course their organization owns. */
  @Get('inbox')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_DISCUSSION)
  async getInbox(@Query() query: CommentInboxQueryDto) {
    return this.courseCommentService.getInbox(this.requestContextService.getOrgId(), query);
  }

  @Get('inbox/count')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_DISCUSSION)
  async getNeedsReplyCount() {
    return this.courseCommentService.getNeedsReplyCount(this.requestContextService.getOrgId());
  }

  /** Staff remove any comment on their own courses: spam, abuse, or a doubt that leaked an answer. */
  @Post('remove/:id')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_DISCUSSION)
  async removeComment(@Param('id') id: string) {
    return this.courseCommentService.remove(this.requestContextService.getOrgId(), id);
  }
}
