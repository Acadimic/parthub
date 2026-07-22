import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import { FollowerService } from './follower.service';
import { UpsertFollowerDto } from './dto/upsert-follower.dto';
import { RequestContextService } from '../../context/request-context.service';

@Controller('follower')
export class FollowerController {
  constructor(
    private readonly followerService: FollowerService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('learn/upsert')
  async upsertFollower(@Body() payload: UpsertFollowerDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.followerService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/followers')
  async getFollowers() {
    const userId = this.requestContextService.getUserId();
    const data = await this.followerService.getFollowers(userId);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/followings')
  async getFollowings() {
    const userId = this.requestContextService.getUserId();
    const data = await this.followerService.getFollowings(userId);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/followers/count')
  async getFollowersCount() {
    const userId = this.requestContextService.getUserId();
    const data = await this.followerService.getFollowersCount(userId);
    return { data, status: HttpStatus.OK };
  }
}
