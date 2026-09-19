import { type IPresignedUrl } from '@repo/shared/contracts';
import { Injectable } from '@nestjs/common';
import { S3Service } from '@modules/s3/s3.service';
import { PresignedPutUrlDto } from './dto/presigned-url.dto';

@Injectable()
export class CommonService {
  constructor(private readonly s3Service: S3Service) {}

  /** `orgId` scopes the keys to that organization's folder; absent — a private route — they land in the shared folder. */
  async getPreSignedPUTUrls(files: PresignedPutUrlDto[], isPublic = false, orgId?: string): Promise<IPresignedUrl[]> {
    const urls = await Promise.all(
      files.map(async (file) => ({
        key: file.key,
        url: await this.s3Service.getPreSignedPUTUrl(file.key, file.contentType, isPublic, orgId),
      })),
    );
    return urls;
  }

  /** Removes objects an attachment no longer points at, within the organization's folder only. */
  async deleteObjects(keys: string[], orgId?: string): Promise<void> {
    await this.s3Service.deleteObjects(keys, orgId);
  }

  async getPreSignedGETUrls(keys: string[], isPublic = false, orgId?: string): Promise<IPresignedUrl[]> {
    const urls = await Promise.all(
      keys.map(async (key) => ({
        key,
        url: await this.s3Service.getPreSignedGETUrl(key, isPublic, orgId),
      })),
    );
    return urls;
  }
}
