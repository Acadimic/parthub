import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './question.schema';
import { QuestionDto } from '@parthhub/shared/validations';

@Injectable()
export class QuestionService {
  constructor(@InjectModel(Question.name) private questionModel: Model<QuestionDocument>) {}

  async upsert(userId: Types.ObjectId, org: Types.ObjectId, payload: QuestionDto): Promise<QuestionDocument> {
    const { _id } = payload;
    return this.questionModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<QuestionDocument>();
  }

  async getQuestionsByIds(ids: string[]): Promise<QuestionDocument[]> {
    if (!ids.length) return [];
    return this.questionModel.find({ _id: { $in: ids }, _deleted: { $ne: true } }).lean<QuestionDocument[]>();
  }

  async getQuestionsBySectionIds(sectionIds: string[]): Promise<QuestionDocument[]> {
    if (!sectionIds.length) return [];
    return this.questionModel
      .find({ section: { $in: sectionIds }, _deleted: { $ne: true } })
      .lean<QuestionDocument[]>();
  }

  async findAll(org: Types.ObjectId) {
    return this.questionModel.find({ org, _deleted: { $ne: true } }).lean<QuestionDocument[]>();
  }

  async findById(org: Types.ObjectId, id: string) {
    return this.questionModel.findOne({ _id: id, org, _deleted: { $ne: true } }).lean<QuestionDocument>();
  }

  async findByTestPaper(org: Types.ObjectId, testPaperId: string) {
    return this.questionModel.find({ testPaper: testPaperId, org, _deleted: { $ne: true } }).lean<QuestionDocument[]>();
  }
}
