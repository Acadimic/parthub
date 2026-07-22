import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestPaper, TestPaperSchema } from './test-paper.schema';
import { TestPaperSection, TestPaperSectionSchema } from './schemas/test-paper-section.schema';
import { TestPaperResult, TestPaperResultSchema } from './schemas/test-paper-result.schema';
import { TestPaperController } from './test-paper.controller';
import { TestPaperService } from './test-paper.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestPaper.name, schema: TestPaperSchema },
      { name: TestPaperSection.name, schema: TestPaperSectionSchema },
      { name: TestPaperResult.name, schema: TestPaperResultSchema },
    ]),
  ],
  controllers: [TestPaperController],
  providers: [TestPaperService],
  exports: [TestPaperService],
})
export class TestPaperModule {}
