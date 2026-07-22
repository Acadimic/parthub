import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import { CommonService } from './common.service';
import { PresignedGetUrlsDto, PresignedPutUrlsDto } from './dto/presigned-url.dto';
import { RequestContextService } from '../../context/request-context.service';
import { SubjectService } from '@modules/subject/subject.service';
import { StandardService } from '@modules/standard/standard.service';
import { StandardSubjectMappingService } from '@modules/standard/standard-subject-mapping.service';
import { Public } from '@decorators/public.decorator';

@Controller('common')
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    private readonly requestContextService: RequestContextService,
    private readonly subjectService: SubjectService,
    private readonly standardService: StandardService,
    private readonly standardSubjectMappingService: StandardSubjectMappingService,
  ) {}

  @Get('admin/initial-data')
  async getAdminInitialData() {
    const [standards, subjects, mappings] = await Promise.all([
      this.standardService.getAll(),
      this.subjectService.getAll(),
      this.standardSubjectMappingService.getAll(),
    ]);
    return { data: { standards, subjects, mappings }, status: HttpStatus.OK };
  }

  @Get('teach/initial-data')
  async getTeachInitialData() {
    const [standards, subjects, mappings] = await Promise.all([
      this.standardService.getAll(),
      this.subjectService.getAll(),
      this.standardSubjectMappingService.getAll(),
    ]);
    return { data: { standards, subjects, mappings }, status: HttpStatus.OK };
  }

  @Get('learn/initial-data')
  async getLearnInitialData() {
    const [standards, subjects, mappings] = await Promise.all([
      this.standardService.getAll(),
      this.subjectService.getAll(),
      this.standardSubjectMappingService.getAll(),
    ]);
    return { data: { standards, subjects, mappings }, status: HttpStatus.OK };
  }

  @Public()
  @Get('learn/public-data')
  async getPublicData() {
    const [standards, subjects] = await Promise.all([
      this.standardService.getAll(),
      this.subjectService.getAll(),
    ]);
    return { data: { standards, subjects }, status: HttpStatus.OK };
  }

  @Post('presigned-PUT-urls')
  async getPreSignedPUTUrls(@Body() payload: PresignedPutUrlsDto) {
    const data = await this.commonService.getPreSignedPUTUrls(payload.files, payload.isPublic);
    return { data, status: HttpStatus.OK };
  }

  @Post('presigned-GET-urls')
  async getPreSignedGETUrls(@Body() payload: PresignedGetUrlsDto) {
    const data = await this.commonService.getPreSignedGETUrls(payload.keys, payload.isPublic);
    return { data, status: HttpStatus.OK };
  }
}
