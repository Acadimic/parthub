import { type IIndexSyncReport, IndexSyncService } from '@database/index-sync.service';
import { Private } from '@decorators/private.decorator';
import { Public } from '@decorators/public.decorator';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { OK } from '@utils/constants';
import { Connection, ConnectionStates } from 'mongoose';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly appService: AppService,
    private readonly indexSyncService: IndexSyncService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  healthCheck() {
    if (this.connection.readyState === ConnectionStates.connected) {
      return OK;
    }
    throw new HttpException('Database connection is not ready', HttpStatus.SERVICE_UNAVAILABLE);
  }

  /**
   * Makes every collection's indexes match its schema, and reports what changed. See
   * `IndexSyncService` for what a sync drops and what it costs.
   *
   * **Destructive, with no preview**, so it is `@Private()`: it drops every index the schemas do
   * not declare, and being a GET it would otherwise run from a crawler or a browser prefetch. A
   * private route gets none of the public header defaults, so a call sends all four headers:
   *
   *   curl -H "api-key: $PRIVATE_API_KEY" -H "app: support" -H "timezone: UTC" \
   *        -H "timezone-offset: 0" "$API/sync-indexes"
   */
  @Private()
  @Get('sync-indexes')
  async syncIndexes(): Promise<IIndexSyncReport> {
    return this.indexSyncService.syncAll();
  }
}
