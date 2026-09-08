import { FollowerDto } from '@repo/shared/validations';
import { PermissionItem, Subdomain } from '@repo/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { FollowerService } from './follower.service';
import { RequestContextService } from '../../context/request-context.service';

@Controller('follower')
export class FollowerController {
  constructor(
    private readonly followerService: FollowerService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_FOLLOWER)
  async upsertFollower(@Body() payload: FollowerDto) {
    const userId = this.requestContextService.getUserId();
    const data = await this.followerService.upsert(userId, payload);
    return data;
  }

  @Get('followers')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_FOLLOWER)
  async getFollowers() {
    const userId = this.requestContextService.getUserId();
    const data = await this.followerService.getFollowers(userId);
    return data;
  }

  @Get('followings')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_FOLLOWER)
  async getFollowings() {
    const userId = this.requestContextService.getUserId();
    const data = await this.followerService.getFollowings(userId);
    return data;
  }

  @Get('followers/count')
  @Subdomains(Subdomain.LEARN)
  @Permissions()
  async getFollowersCount() {
    const userId = this.requestContextService.getUserId();
    const data = await this.followerService.getFollowersCount(userId);
    return data;
  }
}
