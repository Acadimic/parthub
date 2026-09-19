import { Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter, ChapterDocument, ChapterSchema } from './chapter.schema';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Chapter.name, schema: ChapterSchema }])],
  controllers: [ChapterController],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule implements OnModuleInit {
  constructor(@InjectModel(Chapter.name) private readonly chapterModel: Model<ChapterDocument>) {}

  /** Replaces the old sparse unique index with the partial one; a no-op once they match. */
  async onModuleInit(): Promise<void> {
    await this.chapterModel.syncIndexes();
  }
}
