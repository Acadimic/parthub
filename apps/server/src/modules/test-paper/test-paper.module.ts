import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestPaper, TestPaperSchema } from './test-paper.schema';
import { TestPaperController } from './test-paper.controller';
import { TestPaperService } from './test-paper.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: TestPaper.name, schema: TestPaperSchema }])],
  controllers: [TestPaperController],
  providers: [TestPaperService],
  exports: [TestPaperService],
})
export class TestPaperModule {}
