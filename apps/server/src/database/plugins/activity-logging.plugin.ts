import { type Connection, type Document, type Query, type Schema, type Types } from 'mongoose';
import {
  type ActivityLogCoreService,
  type ActivityLogData,
} from '../../modules/activity-log/activity-log-core.service';

const EXCLUDED_MODELS = new Set(['ActivityLog']);

interface QueryOptions {
  skipActivityLog?: boolean;
  _originalDoc?: Record<string, unknown> | null;
  _isRestoreOperation?: boolean;
  _isSoftDelete?: boolean;
  upsert?: boolean;
  _isNewlyCreated?: boolean;
}

interface ModelWithName {
  modelName: string;
}

interface DocWithId {
  _id: Types.ObjectId;
  [key: string]: unknown;
}

interface UpdateQuery {
  $set?: Record<string, unknown>;
}

interface DocumentLike {
  toObject(): Record<string, unknown>;
}

function isDocumentLike(doc: unknown): doc is DocumentLike {
  return typeof doc === 'object' && doc !== null && 'toObject' in doc && typeof doc.toObject === 'function';
}

function hasId(doc: unknown): doc is DocWithId {
  return typeof doc === 'object' && doc !== null && '_id' in doc;
}

function getDocumentAsObject(doc: unknown): Record<string, unknown> {
  if (!doc) return {};
  if (isDocumentLike(doc)) {
    return doc.toObject();
  }
  return doc as Record<string, unknown>;
}

function getConnection(modelOrConstructor: unknown): Connection {
  return (modelOrConstructor as { db: Connection }).db;
}

async function saveActivityLog(connection: Connection, logData: ActivityLogData | null): Promise<void> {
  if (!logData) return;
  try {
    const activityLog = new connection.models.ActivityLog(logData);
    await activityLog.save();
  } catch (err) {
    console.error('Failed to create activity log:', err);
  }
}

/**
 * Which of the three shapes a `findOneAndUpdate` is: a soft delete, a restore, or an upsert. The
 * `_deleted` flag distinguishes the first two, so a plain field update is none of them.
 */
function readUpdateIntent(update: UpdateQuery | null, options: QueryOptions) {
  return {
    isSoftDelete: update?.$set?._deleted === true,
    isRestore: update?.$set?._deleted === false,
    isUpsert: options?.upsert === true,
  };
}

export function createActivityLoggingPlugin(activityLogCoreService: ActivityLogCoreService) {
  /**
   * Writes the delete log for an update that is really a soft delete. A logging failure must never
   * fail the write it describes, so the error is reported and swallowed here rather than rethrown.
   */
  const logSoftDelete = async (query: Query<unknown, unknown>, modelName: string, originalDoc: unknown) => {
    const doc = Array.isArray(originalDoc) ? originalDoc[0] : originalDoc;
    if (!hasId(doc)) return;
    try {
      const logData = activityLogCoreService.prepareDeleteLog(modelName, doc._id, doc);
      await saveActivityLog(getConnection(query.model), logData);
    } catch (error) {
      console.error('Failed to log delete activity:', error);
    }
  };

  return function activityLoggingPlugin(schema: Schema): void {
    schema.pre('save', function (this: Document & { $locals: Record<string, unknown> }) {
      this.$locals.wasNew = this.isNew;
    });

    schema.post('save', async function (this: Document & { _id: Types.ObjectId; $locals: Record<string, unknown> }) {
      if (!this.$locals.wasNew) return;

      const modelName = (this.constructor as unknown as ModelWithName).modelName;
      if (!modelName || EXCLUDED_MODELS.has(modelName)) return;

      try {
        const logData = activityLogCoreService.prepareCreateLog(modelName, this._id, getDocumentAsObject(this));
        const connection = getConnection(this.constructor);
        await saveActivityLog(connection, logData);
      } catch (error) {
        console.error('Failed to log create activity:', error);
      }
    });

    schema.pre('findOneAndUpdate', async function (this: Query<unknown, unknown>) {
      const options = this.getOptions() as QueryOptions;
      if (options?.skipActivityLog === true) return;

      const modelName = (this.model as unknown as ModelWithName).modelName;
      if (!modelName || EXCLUDED_MODELS.has(modelName)) return;

      const update = this.getUpdate() as UpdateQuery;
      const { isSoftDelete, isRestore, isUpsert } = readUpdateIntent(update, options);

      const originalDoc = await this.model.findOne(this.getFilter()).lean();

      if (isSoftDelete && originalDoc) {
        await logSoftDelete(this, modelName, originalDoc);
        this.setOptions({ ...options, _isSoftDelete: true, _originalDoc: null });
        return;
      }

      if (isRestore && originalDoc) {
        this.setOptions({ ...options, _isRestoreOperation: true, _originalDoc: originalDoc });
        return;
      }

      if (!originalDoc && isUpsert) {
        this.setOptions({ ...options, _originalDoc: null, _isNewlyCreated: true });
        return;
      }

      this.setOptions({
        ...options,
        _originalDoc: originalDoc ?? null,
        _isNewlyCreated: false,
        _isRestoreOperation: false,
        _isSoftDelete: false,
      });
    });

    schema.post('findOneAndUpdate', async function (this: Query<unknown, unknown>, doc: unknown) {
      if (!hasId(doc)) return;

      const options = this.getOptions() as QueryOptions;
      if (options?.skipActivityLog === true) return;

      const modelName = (this.model as unknown as ModelWithName).modelName;
      if (!modelName || EXCLUDED_MODELS.has(modelName)) return;

      if (options?._isSoftDelete) return;

      const connection = getConnection(this.model);

      try {
        if (options?._isRestoreOperation) {
          const logData = activityLogCoreService.prepareRestoreLog(modelName, doc._id, getDocumentAsObject(doc));
          await saveActivityLog(connection, logData);
          return;
        }

        if (options?._isNewlyCreated) {
          const logData = activityLogCoreService.prepareCreateLog(modelName, doc._id, getDocumentAsObject(doc));
          await saveActivityLog(connection, logData);
          return;
        }

        const originalDoc = options?._originalDoc;
        if (!originalDoc) return;

        const logData = activityLogCoreService.prepareUpdateLog(
          modelName,
          doc._id,
          originalDoc,
          getDocumentAsObject(doc),
        );
        await saveActivityLog(connection, logData);
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    });
  };
}
