import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../question/question.schema';
import { TestPaperTotalsService } from './test-paper-totals.service';
import { TestPaper, TestPaperSchema } from './test-paper.schema';

/**
 * Totals only.
 *
 * Deliberately depends on no other domain module — it registers the two models it reads directly —
 * so both `QuestionModule` and `TestPaperModule` can import it without either importing the other.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestPaper.name, schema: TestPaperSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  providers: [TestPaperTotalsService],
  exports: [TestPaperTotalsService],
})
export class TestPaperTotalsModule {}
