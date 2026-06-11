import { Controller, Get, Param } from '@nestjs/common';
import { QuestionService } from './question.service';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  async findAll() {
    return this.questionService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.questionService.findById(id);
  }

  @Get('test-paper/:testPaperId')
  async findByTestPaper(@Param('testPaperId') testPaperId: string) {
    return this.questionService.findByTestPaper(testPaperId);
  }
}
