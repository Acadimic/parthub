import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/** What syncing one model's indexes did. */
export interface IIndexSyncResult {
  model: string;
  collection: string;
  /** Index names that were dropped: in the collection, no longer declared by the schema. */
  dropped: string[];
  /** Index key specs that were built: declared by the schema, absent or different in the collection. */
  created: string[];
  /** Set when this model failed. The others still ran — one bad collection does not abort the sweep. */
  error?: string;
}

/**
 * The outcome of one sweep. Models whose indexes already matched are counted rather than listed, so
 * a healthy database answers with a short report instead of one entry per collection.
 */
export interface IIndexSyncReport {
  models: number;
  inSync: number;
  changed: IIndexSyncResult[];
  failed: IIndexSyncResult[];
}

/**
 * Makes every collection's indexes match what its schema declares.
 *
 * This exists because Mongoose only ever *adds*. With `autoIndex` at its default the app builds
 * missing indexes at startup, but it never replaces one whose options changed: MongoDB sees the
 * same name and key, notices the options differ, and errors rather than rebuilding. So a redefined
 * index — the repo's unique indexes moving from `sparse` to `partialFilterExpression` is the case
 * that forced this — stays as it was on every database that already had it, silently enforcing the
 * old rule.
 *
 * Four modules used to close that gap with `syncIndexes()` in their own `onModuleInit`. That worked
 * but said nothing: it ran on every boot whether or not anything had changed, it covered only the
 * four collections someone had remembered to add it to, and it reported neither. This service
 * replaces all four — the sweep is explicit, covers every registered model, and says what changed.
 * `AppController.syncIndexes` exposes it as `GET sync-indexes`.
 *
 * What a sync actually does, and why it is not free:
 *
 * - **It drops.** Any index in the collection that the schema does not declare goes, `_id`
 *   excepted. That includes indexes created by hand outside the schema, and there is no preview —
 *   `Model.diffIndexes()` in a console is the only way to see the list first. Between a drop and
 *   its rebuild the constraint is not enforced, so a unique index has a window.
 * - **It creates collections.** `autoCreate` is on by default, so a model with no collection yet
 *   gets an empty one.
 * - **It costs.** Building an index on a large collection is real work on the primary.
 */
@Injectable()
export class IndexSyncService {
  private readonly logger = new Logger(IndexSyncService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /** One model. Never throws: a failure becomes `error` on the result so the sweep carries on. */
  private async syncOne(name: string): Promise<IIndexSyncResult> {
    const model = this.connection.model(name);
    const result: IIndexSyncResult = {
      model: name,
      collection: model.collection.collectionName,
      dropped: [],
      created: [],
    };

    try {
      // Asked before syncing, because `syncIndexes()` reports only what it dropped — this is where
      // the report's `created` comes from. Mongoose types both arrays as `any[]`; at runtime `toDrop`
      // holds index names and `toCreate` index key specs, converted here rather than asserted so
      // nothing untyped reaches the report.
      const { toDrop, toCreate } = await model.diffIndexes();
      result.dropped = toDrop.map(String);
      result.created = toCreate.map((spec: unknown) => JSON.stringify(spec));

      // Nothing to do is the common case, and `syncIndexes()` on a matching collection still costs
      // a round trip per model. Skipping it keeps a no-op sweep cheap.
      if (!result.dropped.length && !result.created.length) return result;

      await model.syncIndexes();
      this.logger.log(`${name}: dropped ${result.dropped.length}, created ${result.created.length}`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`${name}: index sync failed — ${result.error}`);
    }

    return result;
  }

  /**
   * Sweeps every model registered on the connection, which is every model the app has wired through
   * `MongooseModule.forFeature`. Nest registers them all while it builds the module graph, so by the
   * time a request arrives the list is complete and nothing has to be enumerated by hand.
   */
  async syncAll(): Promise<IIndexSyncReport> {
    const names = [...this.connection.modelNames()].sort();
    const results: IIndexSyncResult[] = [];

    // One model at a time, not `Promise.all`. These are drop and build commands against one
    // connection, and running two dozen at once turns a maintenance call into a load spike.
    for (const name of names) {
      results.push(await this.syncOne(name));
    }

    const failed = results.filter((result) => result.error);
    const changed = results.filter((result) => !result.error && (result.dropped.length || result.created.length));

    return {
      models: results.length,
      inSync: results.length - failed.length - changed.length,
      changed,
      failed,
    };
  }
}
