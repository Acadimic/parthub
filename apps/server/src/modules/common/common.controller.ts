import { Private } from '@decorators';
import { Permissions } from '@decorators/permissions.decorator';
import { Public } from '@decorators/public.decorator';
import { Subdomains } from '@decorators/subdomains.decorator';
import { StandardSubjectMappingService } from '@modules/standard/standard-subject-mapping.service';
import { StandardService } from '@modules/standard/standard.service';
import { SubjectService } from '@modules/subject/subject.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { type ILinkCheck, type IPresignedUrl } from '@repo/shared/contracts';
import { Subdomain } from '@repo/shared/enums';
import { RequestContextService } from '../../context/request-context.service';
import { CommonService } from './common.service';
import { DeleteObjectsDto, PresignedGetUrlsDto, PresignedPutUrlsDto } from './dto/presigned-url.dto';
import { VerifyLinksDto } from './dto/verify-links.dto';
import { LinkCheckService } from './link-check.service';

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
    private readonly linkCheckService: LinkCheckService,
  ) {}

  /**
   * The body behind both `initial-data` routes. Not a route itself — Nest only maps decorated
   * public methods — so the authenticated and private twins cannot drift apart.
   *
   * Deliberately not annotated `Promise<InitialDataResponse>`: standardService, subjectService
   * and standardSubjectMappingService return lean documents whose `_id` is an ObjectId, while the
   * contract declares `string`. The wire shape is right (an ObjectId serializes to a string) but
   * the three collections have no transform step, so the annotation cannot hold until they get one.
   */
  private async loadInitialData() {
    const [standards, subjects, mappings] = await Promise.all([
      this.standardService.getAll(),
      this.subjectService.getAll(),
      this.standardSubjectMappingService.getAll(),
    ]);
    return { standards, subjects, mappings };
  }

  /**
   * The caller's organization — the folder their objects live in.
   *
   * Works on a private route too: `AuthGuard` resolves the `PRIVATE_API_EMAIL` service account and
   * puts its organization in the context, so a machine-to-machine caller is scoped like any other.
   */
  private orgId(): string {
    return this.requestContextService.getOrgId().toString();
  }

  /** The reference data every app loads once an organization is selected. */
  @Get('initial-data')
  @Subdomains(Subdomain.SUPPORT, Subdomain.TEACH, Subdomain.LEARN)
  @Permissions()
  async getInitialData() {
    return this.loadInitialData();
  }

  /** The support dashboard's machine-to-machine twin of `initial-data`. */
  @Private()
  @Get('private-initial-data')
  async privateGetInitialData() {
    return this.loadInitialData();
  }

  @Public()
  @Get('public-data')
  async getPublicData() {
    const [standards, subjects] = await Promise.all([this.standardService.getAll(), this.subjectService.getAll()]);
    return { standards, subjects };
  }

  @Post('presigned-PUT-urls')
  @Permissions()
  async getPreSignedPUTUrls(@Body() payload: PresignedPutUrlsDto): Promise<IPresignedUrl[]> {
    // The organization in context is the folder the files go to, and the only one they can come from.
    const data = await this.commonService.getPreSignedPUTUrls(payload.files, this.orgId(), payload.isPublic);
    return data;
  }

  @Post('presigned-GET-urls')
  @Permissions()
  async getPreSignedGETUrls(@Body() payload: PresignedGetUrlsDto): Promise<IPresignedUrl[]> {
    // Reads are open across organizations: a standard's logo, a subject's icon and a published
    // course's cover all live in whichever organization uploaded them, and every app renders them.
    // Writes stay scoped — `presigned-PUT-urls` and `delete-objects` grant no such allowance.
    const data = await this.commonService.getPreSignedGETUrls(payload.keys, this.orgId(), payload.isPublic, true);
    return data;
  }

  /**
   * Deletes objects whose attachments were removed, or whose record failed to save after the
   * upload. Without it every removed file stayed in the bucket for good.
   */
  @Post('delete-objects')
  @Permissions()
  async deleteObjects(@Body() payload: DeleteObjectsDto): Promise<{ deleted: number }> {
    await this.commonService.deleteObjects(payload.keys, this.orgId());
    return { deleted: payload.keys.length };
  }

  /**
   * Looks up the addresses an AI reply cites, so the importer stores only references that exist.
   * Done here rather than in the browser because cross-origin HEAD requests are blocked there.
   */
  @Post('verify-links')
  @Permissions()
  async verifyLinks(@Body() payload: VerifyLinksDto): Promise<ILinkCheck[]> {
    return this.linkCheckService.verify(payload.urls);
  }

  // The machine-to-machine twins of the two routes above. Same service calls, same shapes — only
  // the guard differs, so any change to the pair above belongs here too.
  //
  // No @Permissions or @Subdomains: AccessGuard returns early for a private route, so both would be
  // inert. The api-key check in AuthGuard is the whole gate.
  @Private()
  @Post('private-presigned-PUT-urls')
  async privateGetPreSignedPUTUrls(@Body() payload: PresignedPutUrlsDto): Promise<IPresignedUrl[]> {
    const data = await this.commonService.getPreSignedPUTUrls(payload.files, this.orgId(), payload.isPublic);
    return data;
  }

  // Takes the same DTO as its authenticated twin rather than a bare `string[]`: the global
  // ValidationPipe runs with `whitelist` and `transform`, which need a class to validate against —
  // a raw array body is passed through unchecked.
  @Private()
  @Post('private-presigned-GET-urls')
  async privateGetPreSignedGETUrls(@Body() payload: PresignedGetUrlsDto): Promise<IPresignedUrl[]> {
    const data = await this.commonService.getPreSignedGETUrls(payload.keys, this.orgId(), payload.isPublic);
    return data;
  }
}
