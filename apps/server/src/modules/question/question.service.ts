import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from './question.schema';
import { UpsertQuestionDto } from '@parthhub/shared/validations';

@Injectable()
export class QuestionService {
  constructor(@InjectModel(Question.name) private questionModel: Model<QuestionDocument>) {}

  async upsert(userId: Types.ObjectId, orgId: Types.ObjectId, payload: UpsertQuestionDto): Promise<QuestionDocument> {
    const { _id } = payload;
    return this.questionModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<QuestionDocument>();
  }

  async getQuestionsByIds(ids: string[]): Promise<QuestionDocument[]> {
    if (!ids.length) return [];
    return this.questionModel
      .find({ _id: { $in: ids }, _deleted: { $ne: true } })
      .lean<QuestionDocument[]>();
  }

  async getQuestionsBySectionIds(sectionIds: string[]): Promise<QuestionDocument[]> {
    if (!sectionIds.length) return [];
    return this.questionModel
      .find({ section: { $in: sectionIds }, _deleted: { $ne: true } })
      .lean<QuestionDocument[]>();
  }

  async findAll() {
    return this.questionModel.find({ _deleted: false }).lean<QuestionDocument[]>();
  }

  async findById(id: string) {
    return this.questionModel.findById(id).lean<QuestionDocument>();
  }

  async findByTestPaper(testPaperId: string) {
    return this.questionModel.find({ testPaper: testPaperId, _deleted: false }).lean<QuestionDocument[]>();
  }
}
