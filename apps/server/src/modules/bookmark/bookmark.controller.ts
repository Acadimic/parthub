import { PermissionItem, Subdomain } from '@parthhub/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, HttpStatus } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { UpsertBookmarkDto } from './dto/upsert-bookmark.dto';
import { User } from '@decorators/user.decorator';
import { RequestContextService } from '../../context/request-context.service';

@Controller('bookmark')
export class BookmarkController {
  constructor(
    private readonly bookmarkService: BookmarkService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_BOOKMARK)
  async upsertBookmark(@Body() payload: UpsertBookmarkDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.bookmarkService.upsert(userId, org, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_BOOKMARK)
  async getBookmarks() {
    const userId = this.requestContextService.getUserId();
    const data = await this.bookmarkService.getBookmarksByUserId(userId);
    return data;
  }
}
