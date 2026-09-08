import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { PlanService } from './plan.service';
import { UpsertPlanDto } from './dto/upsert-plan.dto';
import { RequestContextService } from '../../context/request-context.service';

@Controller('plan')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('teach/upsert')
  async upsertPlan(@Body() payload: UpsertPlanDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.planService.upsert(userId, org, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getCoursePlans() {
    const org = this.requestContextService.getOrgId();
    const data = await this.planService.getCoursePlans(org);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/:id')
  async getPlanById(@Param('id') id: string) {
    const data = await this.planService.getPlanById(id);
    return { data, status: HttpStatus.OK };
  }
}
