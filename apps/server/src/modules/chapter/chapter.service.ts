import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument } from './chapter.schema';

@Injectable()
export class ChapterService {
  constructor(@InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>) {}

  async findByCourse(courseId: string) {
    return this.chapterModel.find({ course: courseId, _deleted: false }).sort({ order: 1 });
  }

  async findById(id: string) {
    return this.chapterModel.findById(id);
  }
}
