import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import { BatchService } from './batch.service';
import { UpsertBatchDto } from './dto/upsert-batch.dto';
import { RequestContextService } from '../../context/request-context.service';

@Controller('batch')
export class BatchController {
  constructor(
    private readonly batchService: BatchService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('teach/upsert')
  async upsertBatch(@Body() payload: UpsertBatchDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.batchService.upsert(userId, org, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getOrgBatches() {
    const org = this.requestContextService.getOrgId();
    const data = await this.batchService.getOrgBatches(org);
    return { data, status: HttpStatus.OK };
  }
}
