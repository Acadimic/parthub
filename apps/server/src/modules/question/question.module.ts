import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './question.schema';
import { Option, OptionSchema } from './schemas/option.schema';
import { Solution, SolutionSchema } from './schemas/solution.schema';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Option.name, schema: OptionSchema },
      { name: Solution.name, schema: SolutionSchema },
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
