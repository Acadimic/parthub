import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContextModule } from '../../context/context.module';
import { ActivityLogCoreModule } from './activity-log-core.module';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLog, ActivityLogSchema } from './activity-log.schema';
import { ActivityLogService } from './activity-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ActivityLog.name, schema: ActivityLogSchema }]),
    ContextModule,
    ActivityLogCoreModule,
  ],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
