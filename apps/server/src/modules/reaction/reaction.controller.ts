import { ReactionDto } from '@repo/shared/validations';
import { PermissionItem, Subdomain } from '@repo/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { RequestContextService } from '../../context/request-context.service';

@Controller('reaction')
export class ReactionController {
  constructor(
    private readonly reactionService: ReactionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_REACTION)
  async upsertReaction(@Body() payload: ReactionDto) {
    const userId = this.requestContextService.getUserId();
    const data = await this.reactionService.upsert(userId, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_REACTION)
  async getReactions() {
    const userId = this.requestContextService.getUserId();
    const data = await this.reactionService.getReactionsByUserId(userId);
    return data;
  }

  @Get('count/:collectionItem')
  @Subdomains(Subdomain.LEARN)
  @Permissions()
  async getReactionsCount(@Param('collectionItem') collectionItem: string) {
    const data = await this.reactionService.getReactionsCount(collectionItem);
    return data;
  }
}
