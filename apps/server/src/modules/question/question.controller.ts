import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { QuestionService } from './question.service';
import { RequestContextService } from '../../context/request-context.service';
import { UpsertQuestionDto } from '@parthhub/shared/validations';

@Controller('question')
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('teach/upsert')
  async upsertQuestion(@Body() payload: UpsertQuestionDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.questionService.upsert(userId, org, payload);
    return { data, status: HttpStatus.OK };
  }

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
