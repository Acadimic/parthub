import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestPaper, TestPaperDocument } from './test-paper.schema';
import { TestPaperDto } from '@parthhub/shared/validations';

@Injectable()
export class TestPaperService {
  constructor(@InjectModel(TestPaper.name) private testPaperModel: Model<TestPaperDocument>) {}

  async upsert(org: Types.ObjectId, payload: TestPaperDto): Promise<TestPaperDocument> {
    const { _id } = payload;
    return this.testPaperModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<TestPaperDocument>();
  }

  async getOrgTestPapers(org: Types.ObjectId): Promise<TestPaperDocument[]> {
    return this.testPaperModel.find({ org, _deleted: { $ne: true } }).lean<TestPaperDocument[]>();
  }

  async getTestPaperById(id: string): Promise<TestPaperDocument> {
    return this.testPaperModel.findOne({ _id: id, _deleted: { $ne: true } }).lean<TestPaperDocument>();
  }

  async updateTotalQuestionsAndMarks(
    org: Types.ObjectId,
    testPaperId: string,
    totalQuestions: number,
    maxMarks: number,
  ): Promise<TestPaperDocument> {
    return this.testPaperModel
      .findOneAndUpdate({ _id: testPaperId, org }, { totalQuestions, maxMarks }, { new: true })
      .lean<TestPaperDocument>();
  }

  async mergeTestPapers(
    org: Types.ObjectId,
    primaryTestPaperId: string,
    secondaryTestPaperId: string,
  ): Promise<TestPaperDocument> {
    const secondaryTestPaper = await this.getOrgTestPaperById(org, secondaryTestPaperId);
    if (!secondaryTestPaper) throw new Error('Secondary test paper not found');
    return this.testPaperModel
      .findOneAndUpdate(
        { _id: primaryTestPaperId, org },
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
    return this.testPaperModel.find({ org, _deleted: { $ne: true } }).lean<TestPaperDocument[]>();
  }

  async getOrgTestPaperById(org: Types.ObjectId, id: string) {
    return this.testPaperModel.findOne({ _id: id, org, _deleted: { $ne: true } }).lean<TestPaperDocument>();
  }
}
