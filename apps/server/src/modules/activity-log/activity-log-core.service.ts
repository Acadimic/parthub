import { Injectable } from '@nestjs/common';
import { AccessType, ActivityAction } from '@repo/shared/enums';
import { Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';

export interface ActivityLogData {
  entityType: string;
  entityId: Types.ObjectId;
  action: ActivityAction;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  changes?: Record<string, { previous: unknown; new: unknown }>;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  org: Types.ObjectId;
  apiRoute: string;
  accessType: AccessType;
}

@Injectable()
export class ActivityLogCoreService {
  constructor(private readonly contextService: RequestContextService) {}

  private getApiRoute(): string | undefined {
    try {
      return this.contextService.getApiRoute();
    } catch {
      return undefined;
    }
  }

  private getAccessType(): AccessType | undefined {
    try {
      return this.contextService.getAccessType();
    } catch {
      return undefined;
    }
  }

  private getUserIdSafe(): Types.ObjectId | undefined {
    return this.contextService.getUserIdSafe();
  }

  private getOrgIdSafe(): Types.ObjectId | undefined {
    return this.contextService.getOrgIdSafe();
  }

  prepareCreateLog(
    entityType: string,
    entityId: Types.ObjectId,
    newState: Record<string, unknown>,
  ): ActivityLogData | null {
    const userId = this.getUserIdSafe();
    const org = this.getOrgIdSafe();
    const apiRoute = this.getApiRoute();
    const accessType = this.getAccessType();
    if (!userId || !org || !apiRoute || !accessType) return null;

    return {
      entityType,
      entityId,
      action: ActivityAction.CREATE,
      newState,
      createdBy: userId,
      updatedBy: userId,
      org,
      apiRoute,
      accessType,
    };
  }

  prepareUpdateLog(
    entityType: string,
    entityId: Types.ObjectId,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
  ): ActivityLogData | null {
    const changes = this.calculateChanges(previousState, newState);

    if (Object.keys(changes).length === 0) {
      return null;
    }

    const userId = this.getUserIdSafe();
    const org = this.getOrgIdSafe();
    const apiRoute = this.getApiRoute();
    const accessType = this.getAccessType();
    if (!userId || !org || !apiRoute || !accessType) return null;

    return {
      entityType,
      entityId,
      action: ActivityAction.UPDATE,
      previousState,
      newState,
      changes,
      createdBy: userId,
      updatedBy: userId,
      org,
      apiRoute,
      accessType,
    };
  }

  prepareDeleteLog(
    entityType: string,
    entityId: Types.ObjectId,
    previousState: Record<string, unknown>,
  ): ActivityLogData | null {
    const userId = this.getUserIdSafe();
    const org = this.getOrgIdSafe();
    const apiRoute = this.getApiRoute();
    const accessType = this.getAccessType();
    if (!userId || !org || !apiRoute || !accessType) return null;

    return {
      entityType,
      entityId,
      action: ActivityAction.DELETE,
      previousState,
      createdBy: userId,
      updatedBy: userId,
      org,
      apiRoute,
      accessType,
    };
  }

  prepareRestoreLog(
    entityType: string,
    entityId: Types.ObjectId,
    newState: Record<string, unknown>,
  ): ActivityLogData | null {
    const userId = this.getUserIdSafe();
    const org = this.getOrgIdSafe();
    const apiRoute = this.getApiRoute();
    const accessType = this.getAccessType();
    if (!userId || !org || !apiRoute || !accessType) return null;

    return {
      entityType,
      entityId,
      action: ActivityAction.RESTORE,
      newState,
      createdBy: userId,
      updatedBy: userId,
      org,
      apiRoute,
      accessType,
    };
  }

  private calculateChanges(
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
  ): Record<string, { previous: unknown; new: unknown }> {
    const changes: Record<string, { previous: unknown; new: unknown }> = {};

    const allKeys = new Set([...Object.keys(previousState), ...Object.keys(newState)]);

    for (const key of allKeys) {
      if (key.startsWith('_') || key === 'updatedAt' || key === 'updatedBy') {
        continue;
      }

      const prevValue = previousState[key];
      const newValue = newState[key];

      if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          previous: prevValue,
          new: newValue,
        };
      }
    }

    return changes;
  }
}
