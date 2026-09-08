import { PermissionService } from '@modules/permissions/permission.service';
import { Body, Controller, Post } from '@nestjs/common';
import { PermissionItem } from '@parthhub/shared';
import { OrgDto, UpdateOrgDto } from '@parthhub/shared/validations';
import { RequestContextService } from '../../context/request-context.service';
import { OrgService } from './org.service';

@Controller('org')
export class OrgController {
  constructor(
    private readonly orgService: OrgService,
    private readonly permissionService: PermissionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  /** Org owners complete or change their organization details after sign-up. */
  @Post('teach/update')
  async updateOrg(@Body() body: UpdateOrgDto): Promise<OrgDto> {
    await this.permissionService.requireAny([PermissionItem.EDIT_ORG]);
    return await this.orgService.update(this.requestContextService.getOrgId(), body);
  }
}
