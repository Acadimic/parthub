import { Global, Module } from '@nestjs/common';
import { ContextModule } from '../../context/context.module';
import { ActivityLogCoreService } from './activity-log-core.service';

@Global()
@Module({
  imports: [ContextModule],
  providers: [ActivityLogCoreService],
  exports: [ActivityLogCoreService],
})
export class ActivityLogCoreModule {}
