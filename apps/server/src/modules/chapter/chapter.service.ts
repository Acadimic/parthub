import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from './chapter.schema';
import { UpsertChapterDto, StandardSubjectQueryDto } from '@parthhub/shared/validations';

@Injectable()
export class ChapterService {
  constructor(@InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>) {}

  async upsert(
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    payload: UpsertChapterDto,
  ): Promise<ChapterDocument> {
    const { _id } = payload;
    return this.chapterModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<ChapterDocument>();
  }

  async getStandardAndSubjectChapters(
    orgId: Types.ObjectId,
    payload: StandardSubjectQueryDto,
  ): Promise<ChapterDocument[]> {
    return this.chapterModel
      .find({ orgId, ...payload, _deleted: { $ne: true } })
      .lean<ChapterDocument[]>();
  }

  async getChapters(orgId: Types.ObjectId): Promise<ChapterDocument[]> {
    return this.chapterModel.find({ orgId, _deleted: { $ne: true } }).lean<ChapterDocument[]>();
  }

  async findByCourse(courseId: string) {
    return this.chapterModel.find({ course: courseId, _deleted: false }).sort({ order: 1 }).lean<ChapterDocument[]>();
  }

  async findById(id: string) {
    return this.chapterModel.findById(id).lean<ChapterDocument>();
  }
}
