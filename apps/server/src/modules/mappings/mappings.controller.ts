import { PermissionItem, Subdomain } from '@parthhub/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Post, Body, HttpStatus, Get } from '@nestjs/common';
import { RequestContextService } from '../../context/request-context.service';
import { StudentStandardMappingService } from './services/student-standard-mapping.service';
import { UserStudentMappingService } from './services/user-student-mapping.service';
import { UserBatchMappingService } from './services/user-batch-mapping.service';
import { StudentStandardMappingDto, UserStudentMappingDto, UserBatchMappingDto } from '@parthhub/shared/validations';

@Controller('mapping')
export class MappingsController {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly studentStandardMappingService: StudentStandardMappingService,
    private readonly userStudentMappingService: UserStudentMappingService,
    private readonly userBatchMappingService: UserBatchMappingService,
  ) {}

  @Post('student-standard/upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MAPPING)
  async upsertStudentStandard(@Body() payload: StudentStandardMappingDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.studentStandardMappingService.upsert(org, payload);
    return data;
  }

  @Post('user-student/upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MAPPING)
  async upsertUserStudent(@Body() payload: UserStudentMappingDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.userStudentMappingService.upsert(org, payload);
    return data;
  }

  @Post('user-batch/upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MAPPING)
  async upsertUserBatch(@Body() payload: UserBatchMappingDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.userBatchMappingService.upsert(org, payload);
    return data;
  }

  @Get('student-standard/all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MAPPING)
  async getStudentStandardMaps() {
    const org = this.requestContextService.getOrgId();
    const data = await this.studentStandardMappingService.getOrgMaps(org);
    return data;
  }

  @Get('user-student/all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MAPPING)
  async getUserStudentMaps() {
    const org = this.requestContextService.getOrgId();
    const data = await this.userStudentMappingService.getOrgMaps(org);
    return data;
  }

  @Get('user-batch/all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MAPPING)
  async getUserBatchMaps() {
    const org = this.requestContextService.getOrgId();
    const data = await this.userBatchMappingService.getOrgMaps(org);
    return data;
  }
}
