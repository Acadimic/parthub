import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { QuestionService } from './question.service';
import { TestPaperTotalsService } from '../test-paper/test-paper-totals.service';
import { RequestContextService } from '../../context/request-context.service';
import { QuestionDto } from '@repo/shared/validations';

@Controller('question')
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly testPaperTotalsService: TestPaperTotalsService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_QUESTION)
  async upsertQuestion(@Body() payload: QuestionDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.questionService.upsert(org, payload);
    // A question changes its section's totals — and a shared section changes several papers'.
    await this.testPaperTotalsService.recalculateForSection(org, payload.section);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_QUESTION)
  async findAll() {
    return this.questionService.findAll(this.requestContextService.getOrgId());
  }

  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_QUESTION)
  async findById(@Param('id') id: string) {
    return this.questionService.findById(this.requestContextService.getOrgId(), id);
  }
}
