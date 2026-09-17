import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TestPaperSectionService } from './test-paper-section.service';
import { TestPaperTotalsService } from './test-paper-totals.service';
import { TestPaperService } from './test-paper.service';
import { RequestContextService } from '../../context/request-context.service';
import { MergeTestPapersDto, TestPaperDto, TestPaperSectionDto } from '@repo/shared/validations';

@Controller('test-paper')
export class TestPaperController {
  constructor(
    private readonly testPaperService: TestPaperService,
    private readonly testPaperSectionService: TestPaperSectionService,
    private readonly testPaperTotalsService: TestPaperTotalsService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TEST_PAPER)
  async upsertTestPaper(@Body() payload: TestPaperDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.testPaperService.upsert(org, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_TEST_PAPER)
  async getOrgTestPapers() {
    const org = this.requestContextService.getOrgId();
    const data = await this.testPaperService.getOrgTestPapers(org);
    return data;
  }

  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_TEST_PAPER)
  async getTestPaperById(@Param('id') id: string) {
    const data = await this.testPaperService.getOrgTestPaperById(this.requestContextService.getOrgId(), id);
    return data;
  }

  @Post('merge')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TEST_PAPER)
  async mergeTestPapers(@Body() payload: MergeTestPapersDto) {
    const data = await this.testPaperService.mergeTestPapers(
      this.requestContextService.getOrgId(),
      payload.primaryTestPaperId,
      payload.secondaryTestPaperId,
    );
    return data;
  }

  @Post('section/upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TEST_PAPER)
  async upsertTestPaperSection(@Body() payload: TestPaperSectionDto) {
    const org = this.requestContextService.getOrgId();
    const section = await this.testPaperSectionService.upsert(org, payload);
    // A section change can move a paper's totals — and a shared section moves several papers'.
    await this.testPaperTotalsService.recalculateForSection(org, payload._id);
    return section;
  }

  @Get('sections-with-questions/:testPaperId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_TEST_PAPER)
  async getSectionsWithQuestions(@Param('testPaperId') testPaperId: string) {
    return this.testPaperService.getSectionsWithQuestions(this.requestContextService.getOrgId(), testPaperId);
  }
}
