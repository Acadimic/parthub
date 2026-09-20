import { type IIndexSyncReport, IndexSyncService } from '@database/index-sync.service';
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
   * Makes every collection's indexes match its schema, and reports what changed — `curl
   * "$API/sync-indexes"`. See `IndexSyncService` for what a sync drops and what it costs.
   *
   * **Open, destructive, and with no preview.** `@Public()`, `@Get` and the absence of a dry run
   * are all as asked for, and each works against this route: anyone who knows the URL can drop
   * every index the schemas do not declare, or load the primary by fetching it in a loop, and
   * because it is a GET a crawler, link preview or browser prefetch can do that without anyone
   * meaning to. There is nothing to type wrong and nothing to check first. If this ever points at
   * a database that matters, move it behind `@Private()` — a one-line change, which would then
   * also need the `app`, `timezone` and `timezone-offset` headers `AuthGuard` re-reads strictly on
   * that branch.
   */
  @Public()
  @Get('sync-indexes')
  async syncIndexes(): Promise<IIndexSyncReport> {
    return this.indexSyncService.syncAll();
  }
}
