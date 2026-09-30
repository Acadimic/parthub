import { Permissions } from '@decorators/permissions.decorator';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { OrgDto, UpdateOrgDto } from '@repo/shared/validations';
import { RequestContextService } from '../../context/request-context.service';
import { OrgService } from './org.service';

@Controller('org')
export class OrgController {
  constructor(
    private readonly orgService: OrgService,
    private readonly requestContextService: RequestContextService,
  ) {}

  /** Org owners complete or change their organization details after sign-up. */
  @Post('update')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.EDIT_ORG)
  async updateOrg(@Body() body: UpdateOrgDto): Promise<OrgDto> {
    return await this.orgService.update(this.requestContextService.getOrgId(), body);
  }
}
