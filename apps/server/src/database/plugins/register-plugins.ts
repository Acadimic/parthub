import { Connection } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { ActivityLogCoreService } from '../../modules/activity-log/activity-log-core.service';
import { createActivityLoggingPlugin } from './activity-logging.plugin';
import { createChangeTrackingPlugin } from './change-tracking.plugin';

export function registerGlobalPlugins(
  connection: Connection,
  contextService: RequestContextService,
  activityLogCoreService: ActivityLogCoreService,
): void {
  const changeTrackingPlugin = createChangeTrackingPlugin(contextService);
  connection.plugin(changeTrackingPlugin);

  const activityLoggingPlugin = createActivityLoggingPlugin(activityLogCoreService);
  connection.plugin(activityLoggingPlugin);
}
