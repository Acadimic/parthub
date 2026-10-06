import { Permissions } from '@decorators/permissions.decorator';
import { Public } from '@decorators/public.decorator';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { CourseReviewDto, DiscussionPageQueryDto } from '@repo/shared/validations';
import { RequestContextService } from '../../context/request-context.service';
import { CourseReviewService } from './course-review.service';

@Controller('course-review')
export class CourseReviewController {
  constructor(
    private readonly courseReviewService: CourseReviewService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_DISCUSSION)
  async upsertReview(@Body() payload: CourseReviewDto) {
    const { requestContextService } = this;
    return this.courseReviewService.upsert(
      requestContextService.getOrgId(),
      requestContextService.getUserId(),
      payload,
    );
  }

  @Get('course/:courseId')
  @Permissions(PermissionItem.VIEW_COURSE)
  async getReviews(@Param('courseId') courseId: string, @Query() query: DiscussionPageQueryDto) {
    return this.courseReviewService.getPage(this.requestContextService.getOrgId(), courseId, query.before ?? null);
  }

  @Get('summary/:courseId')
  @Permissions(PermissionItem.VIEW_COURSE)
  async getSummary(@Param('courseId') courseId: string) {
    const { requestContextService } = this;
    return this.courseReviewService.getSummary(
      requestContextService.getOrgId(),
      requestContextService.getUserId(),
      courseId,
    );
  }

  /** The course's public page shows its rating and reviews to visitors with no session. */
  @Public()
  @Get('published/summary/:courseId')
  async getPublicRating(@Param('courseId') courseId: string) {
    return this.courseReviewService.getPublicRating(courseId);
  }

  @Public()
  @Get('published/:courseId')
  async getPublicReviews(@Param('courseId') courseId: string, @Query() query: DiscussionPageQueryDto) {
    return this.courseReviewService.getPublicPage(courseId, query.before ?? null);
  }
}
