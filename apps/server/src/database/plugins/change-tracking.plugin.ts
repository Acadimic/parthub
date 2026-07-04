import { Document, Query, Schema, Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { BaseSchema } from '../base.schema';

export function createChangeTrackingPlugin(contextService: RequestContextService) {
  return function changeTrackingPlugin(schema: Schema): void {
    schema.pre('save', function (this: Document & BaseSchema, next) {
      try {
        const userId = contextService.getUserId();
        const orgId = contextService.getOrgId();

        if (this.isNew) {
          if (userId) {
            this.createdBy = new Types.ObjectId(userId);
            this.updatedBy = new Types.ObjectId(userId);
          }

          if (orgId) {
            this.orgId = new Types.ObjectId(orgId);
          } else {
            return next(new Error('Organization ID (orgId) is required from context for new documents'));
          }
        } else {
          if (this.isModified('createdBy')) {
            this.createdBy = this.get('createdBy', null, { getters: false }) as Types.ObjectId;
          }

          if (this.isModified('orgId')) {
            this.orgId = this.get('orgId', null, { getters: false }) as Types.ObjectId;
          }

          if (userId) {
            this.updatedBy = new Types.ObjectId(userId);
          } else {
            this.updatedBy = this.get('updatedBy', null, { getters: false }) as Types.ObjectId;
          }
        }

        next();
      } catch (error) {
        next(error as Error);
      }
    });

    const updateHook = function (this: Query<any, any>, next: (error?: Error) => void) {
      try {
        const userId = contextService.getUserId();
        const orgId = contextService.getOrgId();

        const updateObj = this.getUpdate();
        const options = this.getOptions();

        if (!updateObj) {
          return next();
        }

        const update = updateObj as Record<string, any>;

        if (update.$set) {
          if ('createdBy' in (update.$set as Record<string, any>))
            delete (update.$set as Record<string, any>).createdBy;
          if ('orgId' in (update.$set as Record<string, any>))
            delete (update.$set as Record<string, any>).orgId;
        }

        if ('createdBy' in update) delete update.createdBy;
        if ('orgId' in update) delete update.orgId;

        if (userId) {
          if (!update.$set) {
            update.$set = {};
          }
          (update.$set as Record<string, any>).updatedBy = new Types.ObjectId(userId);
          (update.$set as Record<string, any>).updatedAt = new Date();
        }

        if (options && options.upsert === true) {
          if (!update.$setOnInsert) {
            update.$setOnInsert = {};
          }

          if (userId) {
            (update.$setOnInsert as Record<string, any>).createdBy = new Types.ObjectId(userId);
          }

          if (orgId) {
            (update.$setOnInsert as Record<string, any>).orgId = new Types.ObjectId(orgId);
          } else {
            return next(new Error('Organization ID (orgId) is required from context for upsert operations'));
          }
        }

        next();
      } catch (error) {
        next(error as Error);
      }
    };

    schema.pre('updateOne', updateHook);
    schema.pre('updateMany', updateHook);
    schema.pre('findOneAndUpdate', updateHook);

    schema.pre(
      'insertMany',
      function (this: any, next: (error?: Error) => void, docs: Array<Record<string, any>>) {
        try {
          const userId = contextService.getUserId();
          const orgId = contextService.getOrgId();

          if (!Array.isArray(docs)) {
            return next(new Error('Expected an array of documents for insertMany'));
          }

          for (const doc of docs) {
            if (userId) {
              doc.createdBy = new Types.ObjectId(userId);
              doc.updatedBy = new Types.ObjectId(userId);
            }

            if (orgId) {
              doc.orgId = new Types.ObjectId(orgId);
            } else {
              return next(new Error('Organization ID (orgId) is required from context for bulk insert operations'));
            }

            const now = new Date();
            if (!doc.createdAt) doc.createdAt = now;
            if (!doc.updatedAt) doc.updatedAt = now;
          }

          next();
        } catch (error) {
          next(error as Error);
        }
      },
    );
  };
}
