import { BookmarkDto } from '@repo/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark, BookmarkDocument } from './bookmark.schema';

@Injectable()
export class BookmarkService {
  constructor(@InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>) {}

  async upsert(userId: Types.ObjectId, payload: BookmarkDto): Promise<BookmarkDocument> {
    return this.bookmarkModel
      .findOneAndUpdate(
        { createdBy: userId, collectionItem: payload.collectionItem, collectionRef: payload.collectionRef },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<BookmarkDocument>();
  }

  async getBookmarksByUserId(userId: Types.ObjectId): Promise<BookmarkDocument[]> {
    return this.bookmarkModel.find({ createdBy: userId, _deleted: { $ne: true } }).lean<BookmarkDocument[]>();
  }
}
