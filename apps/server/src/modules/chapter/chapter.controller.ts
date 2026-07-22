import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { RequestContextService } from '../../context/request-context.service';
import { UpsertChapterDto, StandardSubjectQueryDto } from '@parthhub/shared/validations';

@Controller('chapter')
export class ChapterController {
  constructor(
    private readonly chapterService: ChapterService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('teach/upsert')
  async upsertChapter(
    @Body() payload: UpsertChapterDto,
  ) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.chapterService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/standard/subject/all')
  async getStandardAndSubjectChapters(@Body() payload: StandardSubjectQueryDto) {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.chapterService.getStandardAndSubjectChapters(orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getOrgChapters() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.chapterService.getChapters(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getLearnChapters() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.chapterService.getChapters(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.chapterService.findByCourse(courseId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.chapterService.findById(id);
  }
}
