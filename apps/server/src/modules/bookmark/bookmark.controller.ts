import { BookmarkDto } from '@repo/shared/validations';
import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
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
  async upsertBookmark(@Body() payload: BookmarkDto) {
    const userId = this.requestContextService.getUserId();
    const data = await this.bookmarkService.upsert(userId, payload);
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
