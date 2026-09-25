import { BookmarkDto } from '@repo/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark, BookmarkDocument } from './bookmark.schema';

@Injectable()
export class BookmarkService {
  constructor(@InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>) {}

  async upsert(userId: Types.ObjectId, payload: BookmarkDto): Promise<BookmarkDocument> {
    // The row is found by its natural key, so a client that never saw it sends a fresh `_id`;
    // applying that to an existing row is an immutable-field update and a 500.
    const { _id, ...fields } = payload;
    // A payload without `_deleted` means "make it active": the client only ever sees active rows,
    // so its insert-shaped payload may well land on a soft-deleted one that must come back.
    return this.bookmarkModel
      .findOneAndUpdate(
        { createdBy: userId, collectionItem: payload.collectionItem, collectionRef: payload.collectionRef },
        { $set: { ...fields, _deleted: fields._deleted ?? false }, $setOnInsert: { _id } },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<BookmarkDocument>();
  }

  async getBookmarksByUserId(userId: Types.ObjectId): Promise<BookmarkDocument[]> {
    return this.bookmarkModel.find({ createdBy: userId, _deleted: { $ne: true } }).lean<BookmarkDocument[]>();
  }
}
