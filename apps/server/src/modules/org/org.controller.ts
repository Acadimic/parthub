import { Controller, Get, Param } from '@nestjs/common';
import { OrgService } from './org.service';

@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  async findAll() {
    return this.orgService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.orgService.findById(id);
  }
}
