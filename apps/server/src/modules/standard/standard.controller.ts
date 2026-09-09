import { PermissionItem, Subdomain } from '@repo/shared/enums';
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

  @Post('upsert')
  @Subdomains(Subdomain.SUPPORT)
  @Permissions(PermissionItem.MANAGE_STANDARD)
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

  @Post('mapping/upsert')
  @Subdomains(Subdomain.SUPPORT)
  @Permissions(PermissionItem.MANAGE_STANDARD)
  async upsertMapping(@Body() payload: StandardSubjectMappingDto) {
    const data = await this.standardSubjectMappingService.upsert(payload);
    return data;
  }

  @Post('mapping/bulk-upsert')
  @Subdomains(Subdomain.SUPPORT)
  @Permissions(PermissionItem.MANAGE_STANDARD)
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
}
