import { BookmarkDto } from '@parthhub/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark, BookmarkDocument } from './bookmark.schema';

@Injectable()
export class BookmarkService {
  constructor(@InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>) {}

  async upsert(userId: Types.ObjectId, org: Types.ObjectId, payload: BookmarkDto): Promise<BookmarkDocument> {
    return this.bookmarkModel
      .findOneAndUpdate(
        { createdBy: userId, collectionItem: payload.collectionItem, collectionRef: payload.collectionRef },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<BookmarkDocument>();
  }

  async getBookmarksByUserId(userId: Types.ObjectId): Promise<BookmarkDocument[]> {
    return this.bookmarkModel.find({ createdBy: userId, isDeleted: { $ne: true } }).lean<BookmarkDocument[]>();
  }
}
