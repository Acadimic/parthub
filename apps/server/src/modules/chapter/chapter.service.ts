import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from './chapter.schema';
import { ChapterDto, StandardSubjectQueryDto } from '@parthhub/shared/validations';

@Injectable()
export class ChapterService {
  constructor(@InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>) {}

  async upsert(userId: Types.ObjectId, org: Types.ObjectId, payload: ChapterDto): Promise<ChapterDocument> {
    const { _id } = payload;
    return this.chapterModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<ChapterDocument>();
  }

  async getStandardAndSubjectChapters(
    org: Types.ObjectId,
    payload: StandardSubjectQueryDto,
  ): Promise<ChapterDocument[]> {
    return this.chapterModel.find({ org, ...payload, _deleted: { $ne: true } }).lean<ChapterDocument[]>();
  }

  async getChapters(org: Types.ObjectId): Promise<ChapterDocument[]> {
    return this.chapterModel.find({ org, _deleted: { $ne: true } }).lean<ChapterDocument[]>();
  }

  async findByCourse(org: Types.ObjectId, courseId: string) {
    return this.chapterModel
      .find({ course: courseId, org, _deleted: { $ne: true } })
      .sort({ order: 1 })
      .lean<ChapterDocument[]>();
  }

  async findById(org: Types.ObjectId, id: string) {
    return this.chapterModel.findOne({ _id: id, org, _deleted: { $ne: true } }).lean<ChapterDocument>();
  }
}
