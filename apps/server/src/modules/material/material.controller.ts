import { PermissionItem, Subdomain } from '@repo/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MaterialService } from './material.service';
import { RequestContextService } from '../../context/request-context.service';
import { MaterialDto, StandardSubjectQueryDto } from '@repo/shared/validations';

@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MATERIAL)
  async upsertMaterial(@Body() payload: MaterialDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.materialService.upsert(org, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MATERIAL)
  async getOrgMaterials() {
    const org = this.requestContextService.getOrgId();
    const data = await this.materialService.getOrgMaterials(org);
    return data;
  }

  @Post('standard/subject/all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_MATERIAL)
  async getStandardAndSubjectMaterials(@Body() body: StandardSubjectQueryDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.materialService.getStandardAndSubjectMaterials(org, body.standard, body.subject);
    return data;
  }

  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MATERIAL)
  async findById(@Param('id') id: string) {
    return this.materialService.findById(this.requestContextService.getOrgId(), id);
  }

  @Get('course/:courseId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MATERIAL)
  async findByCourse(@Param('courseId') courseId: string) {
    return this.materialService.findByCourse(this.requestContextService.getOrgId(), courseId);
  }
}
