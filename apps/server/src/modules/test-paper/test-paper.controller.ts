import { Controller, Get, Param, Query } from '@nestjs/common';
import { TestPaperService } from './test-paper.service';

@Controller('test-paper')
export class TestPaperController {
  constructor(private readonly testPaperService: TestPaperService) {}

  @Get()
  async findAll(@Query('org') org: string) {
    return this.testPaperService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.testPaperService.findById(id);
  }
}
