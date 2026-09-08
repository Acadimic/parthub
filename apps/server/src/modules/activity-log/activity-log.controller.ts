import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityAction, PermissionItem, Subdomain } from '@repo/shared';
import { ActivityLogQueryDto } from '@repo/shared/validations';
import { Types } from 'mongoose';
import { ActivityLog } from './activity-log.schema';
import { ActivityLogService } from './activity-log.service';

@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get(':entityType/:entityId')
  @Subdomains(Subdomain.TEACH, Subdomain.ADMIN)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async getLogsForEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: ActivityLogQueryDto,
  ): Promise<ActivityLog[]> {
    return this.activityLogService.getLogsForEntity(
      entityType,
      new Types.ObjectId(entityId),
      query.limit,
      query.skip,
      query.action as ActivityAction,
    );
  }
}
