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
  async upsertChapter(@Body() payload: UpsertChapterDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.chapterService.upsert(userId, org, payload);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/standard/subject/all')
  async getStandardAndSubjectChapters(@Body() payload: StandardSubjectQueryDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.chapterService.getStandardAndSubjectChapters(org, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getOrgChapters() {
    const org = this.requestContextService.getOrgId();
    const data = await this.chapterService.getChapters(org);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getLearnChapters() {
    const org = this.requestContextService.getOrgId();
    const data = await this.chapterService.getChapters(org);
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
