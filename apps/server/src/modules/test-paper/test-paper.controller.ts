import { PermissionItem, Subdomain } from '@parthhub/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { TestPaperService } from './test-paper.service';
import { RequestContextService } from '../../context/request-context.service';
import { UpsertTestPaperDto } from '@parthhub/shared/validations';

@Controller('test-paper')
export class TestPaperController {
  constructor(
    private readonly testPaperService: TestPaperService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TEST_PAPER)
  async upsertTestPaper(@Body() payload: UpsertTestPaperDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.testPaperService.upsert(userId, org, payload);
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
  async mergeTestPapers(@Body() payload: { primaryTestPaperId: string; secondaryTestPaperId: string }) {
    const data = await this.testPaperService.mergeTestPapers(payload.primaryTestPaperId, payload.secondaryTestPaperId);
    return data;
  }
}
