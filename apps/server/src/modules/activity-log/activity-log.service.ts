import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActivityAction } from '@repo/shared/enums';
import { Model, Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { ActivityLogCoreService } from './activity-log-core.service';
import { ActivityLog } from './activity-log.schema';

/** Paging and filtering for one entity's log, as the controller's query DTO supplies it. */
interface IEntityLogQuery {
  limit?: number;
  skip?: number;
  action?: ActivityAction;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
    private readonly contextService: RequestContextService,
    private readonly activityLogCoreService: ActivityLogCoreService,
  ) {}

  async logCreate(
    entityType: string,
    entityId: Types.ObjectId,
    newState: Record<string, unknown>,
  ): Promise<ActivityLog | null> {
    const logData = this.activityLogCoreService.prepareCreateLog(entityType, entityId, newState);
    if (!logData) return null;

    const activityLog = new this.activityLogModel(logData);
    return activityLog.save();
  }

  async logUpdate(
    entityType: string,
    entityId: Types.ObjectId,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
  ): Promise<ActivityLog | null> {
    const logData = this.activityLogCoreService.prepareUpdateLog(entityType, entityId, previousState, newState);
    if (!logData) return null;

    const activityLog = new this.activityLogModel(logData);
    return activityLog.save();
  }

  async logDelete(
    entityType: string,
    entityId: Types.ObjectId,
    previousState: Record<string, unknown>,
  ): Promise<ActivityLog | null> {
    const logData = this.activityLogCoreService.prepareDeleteLog(entityType, entityId, previousState);
    if (!logData) return null;

    const activityLog = new this.activityLogModel(logData);
    return activityLog.save();
  }

  async logRestore(
    entityType: string,
    entityId: Types.ObjectId,
    newState: Record<string, unknown>,
  ): Promise<ActivityLog | null> {
    const logData = this.activityLogCoreService.prepareRestoreLog(entityType, entityId, newState);
    if (!logData) return null;

    const activityLog = new this.activityLogModel(logData);
    return activityLog.save();
  }

  async getLogsForEntity(
    entityType: string,
    entityId: Types.ObjectId,
    options: IEntityLogQuery = {},
  ): Promise<ActivityLog[]> {
    const { limit = 50, skip = 0, action } = options;
    const query: {
      entityType: string;
      entityId: Types.ObjectId;
      org: Types.ObjectId;
      action?: ActivityAction;
    } = {
      entityType,
      entityId,
      org: this.contextService.getOrgId(),
    };

    if (action) {
      query.action = action;
    }

    return this.activityLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  }
}
