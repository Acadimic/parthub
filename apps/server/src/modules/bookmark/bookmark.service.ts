import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark, BookmarkDocument } from './bookmark.schema';
import { UpsertBookmarkDto } from './dto/upsert-bookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(@InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>) {}

  async upsert(userId: Types.ObjectId, orgId: Types.ObjectId, payload: UpsertBookmarkDto): Promise<BookmarkDocument> {
    return this.bookmarkModel
      .findOneAndUpdate(
        { createdBy: userId, collectionItem: payload.collectionItem, collectionRef: payload.collectionRef },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<BookmarkDocument>();
  }

  async getBookmarksByUserId(userId: Types.ObjectId): Promise<BookmarkDocument[]> {
    return this.bookmarkModel
      .find({ createdBy: userId, _deleted: { $ne: true } })
      .lean<BookmarkDocument[]>();
  }
}
