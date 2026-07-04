import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityAction } from '@parthhub/shared';
import { ActivityLogQueryDto } from '@parthhub/shared/dist/dtos/validations';
import { Types } from 'mongoose';
import { ActivityLog } from './activity-log.schema';
import { ActivityLogService } from './activity-log.service';

@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get(':entityType/:entityId')
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
