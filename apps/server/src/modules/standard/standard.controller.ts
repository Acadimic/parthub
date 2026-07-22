import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import { StandardService } from './standard.service';
import { StandardSubjectMappingService } from './standard-subject-mapping.service';
import { UpsertStandardDto } from './dto/upsert-standard.dto';
import { UpsertStandardSubjectMappingDto } from './dto/upsert-standard-subject-mapping.dto';

@Controller('standard')
export class StandardController {
  constructor(
    private readonly standardService: StandardService,
    private readonly standardSubjectMappingService: StandardSubjectMappingService,
  ) {}

  @Post('admin/upsert')
  async upsertStandard(@Body() payload: UpsertStandardDto) {
    const data = await this.standardService.upsert(payload);
    return { data, status: HttpStatus.OK };
  }

  @Post('admin/bulk-upsert')
  async bulkUpsertStandards(@Body() payloads: UpsertStandardDto[]) {
    const data = await this.standardService.bulkUpsert(payloads);
    return { data, status: HttpStatus.OK };
  }

  @Get('admin/all')
  async getAllStandards() {
    const data = await this.standardService.getAll();
    return { data, status: HttpStatus.OK };
  }

  @Post('admin/mapping/upsert')
  async upsertMapping(@Body() payload: UpsertStandardSubjectMappingDto) {
    const data = await this.standardSubjectMappingService.upsert(payload);
    return { data, status: HttpStatus.OK };
  }

  @Post('admin/mapping/bulk-upsert')
  async bulkUpsertMappings(@Body() payloads: UpsertStandardSubjectMappingDto[]) {
    const data = await this.standardSubjectMappingService.upsertMany(payloads);
    return { data, status: HttpStatus.OK };
  }

  @Get('admin/mapping/all')
  async getAllMappings() {
    const data = await this.standardSubjectMappingService.getAll();
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getStandardsForTeach() {
    const data = await this.standardService.getAll();
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/mapping/all')
  async getMappingsForTeach() {
    const data = await this.standardSubjectMappingService.getAll();
    return { data, status: HttpStatus.OK };
  }
}
