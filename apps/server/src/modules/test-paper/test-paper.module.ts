import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionModule } from '../question/question.module';
import { TestPaperResult, TestPaperResultSchema } from './schemas/test-paper-result.schema';
import { TestPaperSection, TestPaperSectionSchema } from './schemas/test-paper-section.schema';
import { TestPaperController } from './test-paper.controller';
import { TestPaperResultService } from './test-paper-result.service';
import { TestPaperSectionService } from './test-paper-section.service';
import { TestPaperTotalsModule } from './test-paper-totals.module';
import { TestPaperService } from './test-paper.service';
import { TestPaper, TestPaperSchema } from './test-paper.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestPaper.name, schema: TestPaperSchema },
      { name: TestPaperSection.name, schema: TestPaperSectionSchema },
      { name: TestPaperResult.name, schema: TestPaperResultSchema },
    ]),
    // The totals aggregation and the sections-with-questions read both run over questions.
    QuestionModule,
    TestPaperTotalsModule,
  ],
  controllers: [TestPaperController],
  providers: [TestPaperService, TestPaperSectionService, TestPaperResultService],
  exports: [TestPaperService, TestPaperSectionService, TestPaperResultService],
})
export class TestPaperModule {}
