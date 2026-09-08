import { PermissionItem, Subdomain } from '@repo/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { RequestContextService } from '../../context/request-context.service';
import { ChapterDto, StandardSubjectQueryDto } from '@repo/shared/validations';

@Controller('chapter')
export class ChapterController {
  constructor(
    private readonly chapterService: ChapterService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_CHAPTER)
  async upsertChapter(@Body() payload: ChapterDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.chapterService.upsert(org, payload);
    return data;
  }

  @Post('standard/subject/all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_MATERIAL, PermissionItem.MANAGE_CHAPTER)
  async getStandardAndSubjectChapters(@Body() payload: StandardSubjectQueryDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.chapterService.getStandardAndSubjectChapters(org, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MATERIAL)
  async getOrgChapters() {
    const org = this.requestContextService.getOrgId();
    const data = await this.chapterService.getChapters(org);
    return data;
  }

  @Get('course/:courseId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MATERIAL)
  async findByCourse(@Param('courseId') courseId: string) {
    return this.chapterService.findByCourse(this.requestContextService.getOrgId(), courseId);
  }

  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MATERIAL)
  async findById(@Param('id') id: string) {
    return this.chapterService.findById(this.requestContextService.getOrgId(), id);
  }
}
