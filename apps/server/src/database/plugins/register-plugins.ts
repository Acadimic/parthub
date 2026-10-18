import { type Connection } from 'mongoose';
import { type RequestContextService } from '../../context/request-context.service';
import { createChangeTrackingPlugin } from './change-tracking.plugin';

/**
 * Activity logging is paused: `createActivityLoggingPlugin` (activity-logging.plugin.ts) is not
 * registered, so no write adds an `activitylogs` row. Re-enable by registering it here again.
 */
export function registerGlobalPlugins(connection: Connection, contextService: RequestContextService): void {
  const changeTrackingPlugin = createChangeTrackingPlugin(contextService);
  connection.plugin(changeTrackingPlugin);
}
