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

  @Post('teach/upsert')
  async upsertTestPaper(@Body() payload: UpsertTestPaperDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.testPaperService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getOrgTestPapers() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.testPaperService.getOrgTestPapers(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/:id')
  async getTestPaperById(@Param('id') id: string) {
    const data = await this.testPaperService.getTestPaperById(id);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/merge')
  async mergeTestPapers(@Body() payload: { primaryTestPaperId: string; secondaryTestPaperId: string }) {
    const data = await this.testPaperService.mergeTestPapers(
      payload.primaryTestPaperId,
      payload.secondaryTestPaperId,
    );
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getLearnTestPapers() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.testPaperService.getOrgTestPapers(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get()
  async findAll(@Query('org') org: string) {
    return this.testPaperService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.testPaperService.findById(id);
  }
}
