import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Private } from '@decorators';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, ParseArrayPipe } from '@nestjs/common';
import { StandardService } from './standard.service';
import { StandardSubjectMappingService } from './standard-subject-mapping.service';
import { StandardDto, StandardSubjectMappingDto } from '@repo/shared/validations';

@Controller('standard')
export class StandardController {
  constructor(
    private readonly standardService: StandardService,
    private readonly standardSubjectMappingService: StandardSubjectMappingService,
  ) {}

  // Private, not authenticated: the support dashboard is the only caller and reaches it
  // machine-to-machine. Writes still stamp org/createdBy/updatedBy, because AuthGuard resolves a
  // real service account for private routes — see `getPrivateIdentity`.
  @Private()
  @Post('upsert')
  async upsertStandard(@Body() payload: StandardDto) {
    const data = await this.standardService.upsert(payload);
    return data;
  }

  @Post('bulk-upsert')
  @Subdomains(Subdomain.SUPPORT)
  @Permissions(PermissionItem.MANAGE_STANDARD)
  async bulkUpsertStandards(
    @Body(new ParseArrayPipe({ items: StandardDto, whitelist: true, forbidNonWhitelisted: true }))
    payloads: StandardDto[],
  ) {
    const data = await this.standardService.bulkUpsert(payloads);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.SUPPORT, Subdomain.TEACH, Subdomain.LEARN)
  @Permissions()
  async getAllStandards() {
    const data = await this.standardService.getAll();
    return data;
  }

  /** The support dashboard's machine-to-machine twin of `all`. */
  @Private()
  @Get('private-all')
  async privateGetAllStandards() {
    const data = await this.standardService.getAll();
    return data;
  }

  @Post('mapping/upsert')
  @Subdomains(Subdomain.SUPPORT)
  @Permissions(PermissionItem.MANAGE_STANDARD)
  async upsertMapping(@Body() payload: StandardSubjectMappingDto) {
    const data = await this.standardSubjectMappingService.upsert(payload);
    return data;
  }

  @Private()
  @Post('mapping/bulk-upsert')
  async bulkUpsertMappings(
    @Body(new ParseArrayPipe({ items: StandardSubjectMappingDto, whitelist: true, forbidNonWhitelisted: true }))
    payloads: StandardSubjectMappingDto[],
  ) {
    const data = await this.standardSubjectMappingService.upsertMany(payloads);
    return data;
  }

  @Get('mapping/all')
  @Subdomains(Subdomain.SUPPORT, Subdomain.TEACH, Subdomain.LEARN)
  @Permissions()
  async getAllMappings() {
    const data = await this.standardSubjectMappingService.getAll();
    return data;
  }

  /** The support dashboard's machine-to-machine twin of `mapping/all`. */
  @Private()
  @Get('private-mapping/all')
  async privateGetAllMappings() {
    const data = await this.standardSubjectMappingService.getAll();
    return data;
  }
}
