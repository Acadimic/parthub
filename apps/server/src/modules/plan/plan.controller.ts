import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanDto } from '@repo/shared/validations';
import { RequestContextService } from '../../context/request-context.service';

@Controller('plan')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_PLAN)
  async upsertPlan(@Body() payload: PlanDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.planService.upsert(org, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_PLAN)
  async getCoursePlans() {
    const org = this.requestContextService.getOrgId();
    const data = await this.planService.getCoursePlans(org);
    return data;
  }

  @Get('course/:courseId')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_PLAN)
  async getPlansByCourseId(@Param('courseId') courseId: string) {
    const org = this.requestContextService.getOrgId();
    return this.planService.getPlansByCourseId(org, courseId);
  }

  @Get(':id')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_PLAN)
  async getPlanById(@Param('id') id: string) {
    const data = await this.planService.getOrgPlanById(this.requestContextService.getOrgId(), id);
    if (!data) throw new NotFoundException('Plan not found.');
    return data;
  }
}
