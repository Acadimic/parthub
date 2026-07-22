import { Controller, Get, Post, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { MaterialService } from './material.service';
import { RequestContextService } from '../../context/request-context.service';
import { UpsertMaterialDto } from '@parthhub/shared/validations';

@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('teach/upsert')
  async upsertMaterial(@Body() payload: UpsertMaterialDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.materialService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getOrgMaterials() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.materialService.getOrgMaterials(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/standard/subject/all')
  async getStandardAndSubjectMaterials(@Body() body: { standard: string; subject: string }) {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.materialService.getStandardAndSubjectMaterials(orgId, body.standard, body.subject);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getLearnMaterials() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.materialService.getOrgMaterials(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get()
  async findAll(@Query('org') org: string) {
    return this.materialService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.materialService.findById(id);
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.materialService.findByCourse(courseId);
  }
}
