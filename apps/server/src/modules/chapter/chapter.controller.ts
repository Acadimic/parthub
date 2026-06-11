import { Controller, Get, Param } from '@nestjs/common';
import { ChapterService } from './chapter.service';

@Controller('chapter')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.chapterService.findByCourse(courseId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.chapterService.findById(id);
  }
}
