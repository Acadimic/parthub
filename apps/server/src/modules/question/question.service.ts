import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './question.schema';

@Injectable()
export class QuestionService {
  constructor(@InjectModel(Question.name) private questionModel: Model<QuestionDocument>) {}

  async findAll() {
    return this.questionModel.find({ _deleted: false });
  }

  async findById(id: string) {
    return this.questionModel.findById(id);
  }

  async findByTestPaper(testPaperId: string) {
    return this.questionModel.find({ testPaper: testPaperId, _deleted: false });
  }
}
