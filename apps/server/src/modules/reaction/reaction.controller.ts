import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { UpsertReactionDto } from './dto/upsert-reaction.dto';
import { RequestContextService } from '../../context/request-context.service';

@Controller('reaction')
export class ReactionController {
  constructor(
    private readonly reactionService: ReactionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('learn/upsert')
  async upsertReaction(@Body() payload: UpsertReactionDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.reactionService.upsert(userId, org, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getReactions() {
    const userId = this.requestContextService.getUserId();
    const data = await this.reactionService.getReactionsByUserId(userId);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/count/:collectionItem')
  async getReactionsCount(@Param('collectionItem') collectionItem: string) {
    const data = await this.reactionService.getReactionsCount(collectionItem);
    return { data, status: HttpStatus.OK };
  }
}
