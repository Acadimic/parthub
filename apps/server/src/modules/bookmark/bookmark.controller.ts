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

  @Post('learn/upsert')
  async upsertBookmark(@Body() payload: UpsertBookmarkDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.bookmarkService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getBookmarks() {
    const userId = this.requestContextService.getUserId();
    const data = await this.bookmarkService.getBookmarksByUserId(userId);
    return { data, status: HttpStatus.OK };
  }
}
