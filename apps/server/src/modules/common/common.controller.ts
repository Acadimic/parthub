import { Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CommonService } from './common.service';
import { PresignedGetUrlsDto, PresignedPutUrlsDto } from './dto/presigned-url.dto';
import { RequestContextService } from '../../context/request-context.service';
import { SubjectService } from '@modules/subject/subject.service';
import { StandardService } from '@modules/standard/standard.service';
import { StandardSubjectMappingService } from '@modules/standard/standard-subject-mapping.service';
import { Public } from '@decorators/public.decorator';

@Controller('common')
export class CommonController {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.
  // eslint-disable-next-line max-params
  constructor(
    private readonly commonService: CommonService,
    private readonly requestContextService: RequestContextService,
    private readonly subjectService: SubjectService,
    private readonly standardService: StandardService,
    private readonly standardSubjectMappingService: StandardSubjectMappingService,
  ) {}

  /** The reference data every app loads once an organization is selected. */
  @Get('initial-data')
  @Subdomains(Subdomain.SUPPORT, Subdomain.TEACH, Subdomain.LEARN)
  @Permissions()
  // Deliberately not annotated `Promise<InitialDataResponse>`: standardService, subjectService
  // and standardSubjectMappingService return lean documents whose `_id` is an ObjectId, while the
  // contract declares `string`. The wire shape is right (an ObjectId serializes to a string) but
  // the three collections have no transform step, so the annotation cannot hold until they get one.
  async getInitialData() {
    const [standards, subjects, mappings] = await Promise.all([
      this.standardService.getAll(),
      this.subjectService.getAll(),
      this.standardSubjectMappingService.getAll(),
    ]);
    return { standards, subjects, mappings };
  }

  @Public()
  @Get('public-data')
  async getPublicData() {
    const [standards, subjects] = await Promise.all([this.standardService.getAll(), this.subjectService.getAll()]);
    return { standards, subjects };
  }

  @Post('presigned-PUT-urls')
  @Permissions()
  async getPreSignedPUTUrls(@Body() payload: PresignedPutUrlsDto) {
    const data = await this.commonService.getPreSignedPUTUrls(payload.files, payload.isPublic);
    return data;
  }

  @Post('presigned-GET-urls')
  @Permissions()
  async getPreSignedGETUrls(@Body() payload: PresignedGetUrlsDto) {
    const data = await this.commonService.getPreSignedGETUrls(payload.keys, payload.isPublic);
    return data;
  }
}
