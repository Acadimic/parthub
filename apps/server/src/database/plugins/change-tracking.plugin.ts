import { type Document, type Query, type Schema } from 'mongoose';
import { type RequestContextService } from '../../context/request-context.service';
import { type BaseSchema } from '../base.schema';

type UpdateObject = Record<string, unknown>;

/** The bulkWrite operations this plugin stamps. Mongoose accepts more; these are the writes. */
interface BulkWriteOperation {
  insertOne?: { document: UpdateObject };
  replaceOne?: { replacement: UpdateObject; upsert?: boolean };
  updateOne?: { update?: UpdateObject | unknown[]; upsert?: boolean };
  updateMany?: { update?: UpdateObject | unknown[]; upsert?: boolean };
}

/**
 * Registers a model-level pre hook.
 *
 * Mongoose 9 still fires `insertMany` and `bulkWrite` pre hooks — `lib/model.js` calls
 * `execPre('insertMany', this, [docs])` and `execPre('bulkWrite', this, [ops, options])` — but 9.x
 * dropped both names from its exported middleware unions, so `schema.pre()` no longer types them.
 * The cast is on the registration only; the hook functions below keep their real signatures.
 */
const preModelHook = <A extends unknown[]>(
  schema: Schema,
  name: 'insertMany' | 'bulkWrite',
  fn: (...args: A) => void,
): void => {
  (schema.pre as unknown as (n: string, f: (...args: A) => void) => void)(name, fn);
};

/** Ownership fields that are stamped once, on insert, and must never be reassigned by an update. */
const IMMUTABLE_FIELDS = ['org', 'createdBy'] as const;

/**
 * Fills the `BaseSchema` ownership fields from the request context on every write:
 *
 * | operation                                            | org / createdBy | updatedBy | createdAt / updatedAt | _deleted |
 * | ---------------------------------------------------- | --------------- | --------- | --------------------- | -------- |
 * | `save` (incl. `create`, `new Model()`)               | plugin, if new  | plugin    | `timestamps: true`    | default  |
 * | `insertMany`                                         | plugin          | plugin    | plugin                | default  |
 * | `updateOne` / `updateMany` / `findOneAndUpdate`      | stripped        | plugin    | `timestamps: true`    | -        |
 * | ...the same with `upsert: true`                      | plugin, on insert | plugin  | mongoose, on insert   | mongoose |
 * | `replaceOne` / `findOneAndReplace`                   | plugin          | plugin    | `timestamps: true`    | default  |
 * | `bulkWrite`                                          | plugin, per op  | plugin    | mongoose / plugin     | mongoose |
 *
 * `createdAt`/`updatedAt` come from each schema's `timestamps: true`, and `_deleted` from its own
 * default (Mongoose applies defaults on upsert-insert via `setDefaultsOnInsert`, on by default).
 */
export function createChangeTrackingPlugin(contextService: RequestContextService) {
  // Safe accessors: public and private routes run with a minimal context whose ids are empty
  // strings, and background work has no context at all. The throwing getters would surface a
  // BSONError from deep inside a write instead of the guard messages below.
  const userId = () => contextService.getUserIdSafe();
  const orgId = () => contextService.getOrgIdSafe();

  const missingOrg = (operation: string) =>
    new Error(`Organization (org) is required from the request context for ${operation}`);

  /**
   * Applies the ownership stamps to one bulkWrite `updateOne`/`updateMany` operation: the immutable
   * fields are stripped so a caller cannot reassign them, and an upsert additionally seeds `org` and
   * `createdBy` through `$setOnInsert` because the insert path never runs a document hook.
   */
  const stampBulkUpdate = (write: NonNullable<BulkWriteOperation['updateOne']>) => {
    const update = write.update as UpdateObject | undefined;
    if (!update || Array.isArray(update)) return;
    const user = userId();
    for (const field of IMMUTABLE_FIELDS) {
      delete update[field];
      if (update.$set) delete (update.$set as UpdateObject)[field];
    }
    if (user) {
      update.$set = update.$set || {};
      (update.$set as UpdateObject).updatedBy = user;
    }
    if (write.upsert) {
      const org = orgId();
      if (!org) throw missingOrg('bulkWrite upsert');
      update.$setOnInsert = update.$setOnInsert || {};
      (update.$setOnInsert as UpdateObject).org = org;
      if (user) (update.$setOnInsert as UpdateObject).createdBy = user;
    }
  };

  /** Stamps a plain object that is about to be inserted. */
  const stampInsert = (doc: UpdateObject, operation: string): Error | undefined => {
    const org = orgId();
    if (!org) return missingOrg(operation);
    const user = userId();
    if (user) {
      doc.createdBy = user;
      doc.updatedBy = user;
    }
    doc.org = org;
    const now = new Date();
    if (!doc.createdAt) doc.createdAt = now;
    if (!doc.updatedAt) doc.updatedAt = now;
    return undefined;
  };

  return function changeTrackingPlugin(schema: Schema): void {
    schema.pre('save', function (this: Document & BaseSchema) {
      const user = userId();

      if (this.isNew) {
        const org = orgId();
        if (!org) throw missingOrg('new documents');
        this.org = org;
        if (user) {
          this.createdBy = user;
          this.updatedBy = user;
        }
      } else {
        // Restore either field if application code reassigned it on an existing document.
        for (const field of IMMUTABLE_FIELDS) {
          if (this.isModified(field)) {
            this.set(field, this.get(field, null, { getters: false }), { strict: false });
            this.unmarkModified(field);
          }
        }
        if (user) this.updatedBy = user;
      }
    });

    const updateHook = function (this: Query<unknown, unknown>) {
      const updateObj = this.getUpdate();
      if (!updateObj) return;

      // Aggregation-pipeline updates are an array of stages; there is no $set to extend, so
      // append one stage rather than corrupting the pipeline with object properties.
      if (Array.isArray(updateObj)) {
        const pipelineUser = userId();
        if (pipelineUser) updateObj.push({ $set: { updatedBy: pipelineUser } });
        return;
      }

      const update = updateObj as UpdateObject;

      for (const field of IMMUTABLE_FIELDS) {
        delete update[field];
        if (update.$set) delete (update.$set as UpdateObject)[field];
        if (update.$setOnInsert) delete (update.$setOnInsert as UpdateObject)[field];
      }

      const user = userId();
      if (user) {
        update.$set = update.$set || {};
        (update.$set as UpdateObject).updatedBy = user;
      }

      if (this.getOptions()?.upsert) {
        const org = orgId();
        if (!org) throw missingOrg('upsert operations');
        update.$setOnInsert = update.$setOnInsert || {};
        (update.$setOnInsert as UpdateObject).org = org;
        if (user) (update.$setOnInsert as UpdateObject).createdBy = user;
      }
    };

    schema.pre('updateOne', updateHook);
    schema.pre('updateMany', updateHook);
    schema.pre('findOneAndUpdate', updateHook);

    // A replace swaps the whole document, so the ownership fields have to be re-supplied or they
    // are silently dropped — `immutable` does not protect against replacement.
    const replaceHook = function (this: Query<unknown, unknown>) {
      const replacement = this.getUpdate() as UpdateObject | null;
      if (!replacement || Array.isArray(replacement)) return;
      const error = stampInsert(replacement, 'replace operations');
      if (error) throw error;
    };

    schema.pre('replaceOne', replaceHook);
    schema.pre('findOneAndReplace', replaceHook);

    preModelHook(schema, 'insertMany', (docs: UpdateObject[]) => {
      if (!Array.isArray(docs)) throw new Error('Expected an array of documents for insertMany');
      for (const doc of docs) {
        const error = stampInsert(doc, 'bulk insert operations');
        if (error) throw error;
      }
    });

    preModelHook(schema, 'bulkWrite', (ops: unknown) => {
      if (!Array.isArray(ops)) return;
      for (const op of ops as BulkWriteOperation[]) {
        if (op.insertOne?.document) {
          const error = stampInsert(op.insertOne.document, 'bulkWrite insertOne');
          if (error) throw error;
          continue;
        }
        if (op.replaceOne?.replacement) {
          const error = stampInsert(op.replaceOne.replacement, 'bulkWrite replaceOne');
          if (error) throw error;
          continue;
        }
        const write = op.updateOne ?? op.updateMany;
        if (write) stampBulkUpdate(write);
      }
    });
  };
}
