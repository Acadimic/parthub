import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestPaper, TestPaperDocument } from './test-paper.schema';

@Injectable()
export class TestPaperService {
  constructor(@InjectModel(TestPaper.name) private testPaperModel: Model<TestPaperDocument>) {}

  async findAll(org: string) {
    return this.testPaperModel.find({ orgId: org, _deleted: false });
  }

  async findById(id: string) {
    return this.testPaperModel.findById(id);
  }
}
