import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestPaper, TestPaperDocument } from './test-paper.schema';
import { TestPaperDto } from '@parthhub/shared/validations';

@Injectable()
export class TestPaperService {
  constructor(@InjectModel(TestPaper.name) private testPaperModel: Model<TestPaperDocument>) {}

  async upsert(userId: Types.ObjectId, org: Types.ObjectId, payload: TestPaperDto): Promise<TestPaperDocument> {
    const { _id } = payload;
    return this.testPaperModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<TestPaperDocument>();
  }

  async getOrgTestPapers(org: Types.ObjectId): Promise<TestPaperDocument[]> {
    return this.testPaperModel.find({ org, isDeleted: { $ne: true } }).lean<TestPaperDocument[]>();
  }

  async getTestPaperById(id: string): Promise<TestPaperDocument> {
    return this.testPaperModel.findOne({ _id: id, isDeleted: { $ne: true } }).lean<TestPaperDocument>();
  }

  async updateTotalQuestionsAndMarks(
    testPaperId: string,
    totalQuestions: number,
    maxMarks: number,
  ): Promise<TestPaperDocument> {
    return this.testPaperModel
      .findOneAndUpdate({ _id: testPaperId }, { totalQuestions, maxMarks }, { new: true })
      .lean<TestPaperDocument>();
  }

  async mergeTestPapers(primaryTestPaperId: string, secondaryTestPaperId: string): Promise<TestPaperDocument> {
    const secondaryTestPaper = await this.getTestPaperById(secondaryTestPaperId);
    if (!secondaryTestPaper) throw new Error('Secondary test paper not found');
    return this.testPaperModel
      .findOneAndUpdate(
        { _id: primaryTestPaperId },
        {
          $inc: {
            totalQuestions: secondaryTestPaper.totalQuestions,
            maxMarks: secondaryTestPaper.maxMarks,
            durationMins: secondaryTestPaper.durationMins,
          },
          $addToSet: {
            sections: secondaryTestPaper.sections,
            standards: secondaryTestPaper.standards,
            subjects: secondaryTestPaper.subjects,
            mergedTestPapers: secondaryTestPaperId,
          },
        },
        { new: true, runValidators: true },
      )
      .lean<TestPaperDocument>();
  }

  async findAll(org: string) {
    return this.testPaperModel.find({ org, isDeleted: { $ne: true } }).lean<TestPaperDocument[]>();
  }

  async getOrgTestPaperById(org: Types.ObjectId, id: string) {
    return this.testPaperModel.findOne({ _id: id, org, isDeleted: { $ne: true } }).lean<TestPaperDocument>();
  }
}
