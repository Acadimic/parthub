import { PermissionItem, Subdomain } from '@repo/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
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

  @Get(':id')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_PLAN)
  async getPlanById(@Param('id') id: string) {
    const data = await this.planService.getPlanById(id);
    return data;
  }
}
