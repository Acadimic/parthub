import { Controller, Post, Body, HttpStatus, Get } from '@nestjs/common';
import { RequestContextService } from '../../context/request-context.service';
import { StudentStandardMappingService } from './services/student-standard-mapping.service';
import { UserStudentMappingService } from './services/user-student-mapping.service';
import { UserBatchMappingService } from './services/user-batch-mapping.service';
import { UpsertStudentStandardMappingDto } from './dto/upsert-student-standard-mapping.dto';
import { UpsertUserStudentMappingDto } from './dto/upsert-user-student-mapping.dto';
import { UpsertUserBatchMappingDto } from './dto/upsert-user-batch-mapping.dto';

@Controller('mapping')
export class MappingsController {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly studentStandardMappingService: StudentStandardMappingService,
    private readonly userStudentMappingService: UserStudentMappingService,
    private readonly userBatchMappingService: UserBatchMappingService,
  ) {}

  @Post('teach/student-standard/upsert')
  async upsertStudentStandard(@Body() payload: UpsertStudentStandardMappingDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.studentStandardMappingService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/user-student/upsert')
  async upsertUserStudent(@Body() payload: UpsertUserStudentMappingDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.userStudentMappingService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/user-batch/upsert')
  async upsertUserBatch(@Body() payload: UpsertUserBatchMappingDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.userBatchMappingService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/student-standard/all')
  async getStudentStandardMaps() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.studentStandardMappingService.getOrgMaps(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/user-student/all')
  async getUserStudentMaps() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.userStudentMappingService.getOrgMaps(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/user-batch/all')
  async getUserBatchMaps() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.userBatchMappingService.getOrgMaps(orgId);
    return { data, status: HttpStatus.OK };
  }
}
