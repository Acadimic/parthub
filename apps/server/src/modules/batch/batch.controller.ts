import { PermissionItem, Subdomain } from '@parthhub/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import { BatchService } from './batch.service';
import { UpsertBatchDto } from './dto/upsert-batch.dto';
import { RequestContextService } from '../../context/request-context.service';

@Controller('batch')
export class BatchController {
  constructor(
    private readonly batchService: BatchService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_BATCH)
  async upsertBatch(@Body() payload: UpsertBatchDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.batchService.upsert(userId, org, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_BATCH, PermissionItem.MANAGE_BATCH)
  async getOrgBatches() {
    const org = this.requestContextService.getOrgId();
    const data = await this.batchService.getOrgBatches(org);
    return data;
  }
}
