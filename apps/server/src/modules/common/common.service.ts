import { S3Service } from '@modules/s3/s3.service';
import { Injectable } from '@nestjs/common';
import { type IPresignedUrl } from '@repo/shared/contracts';
import { PresignedPutUrlDto } from './dto/presigned-url.dto';

@Injectable()
export class CommonService {
  constructor(private readonly s3Service: S3Service) {}

  /** `orgId` is the folder the files go to, and the only one they can come from. */
  async getPreSignedPUTUrls(files: PresignedPutUrlDto[], orgId: string, isPublic = false): Promise<IPresignedUrl[]> {
    const urls = await Promise.all(
      files.map(async (file) => ({
        key: file.key,
        url: await this.s3Service.getPreSignedPUTUrl(file.key, file.contentType, orgId, isPublic),
      })),
    );
    return urls;
  }

  /** Removes objects an attachment no longer points at, within the organization's folder only. */
  async deleteObjects(keys: string[], orgId: string): Promise<void> {
    await this.s3Service.deleteObjects(keys, orgId);
  }

  /** `isAnyOrgReadable` lets the caller read another organization's folder too; see `resolveKey`. */
  async getPreSignedGETUrls(
    keys: string[],
    orgId: string,
    isPublic = false,
    isAnyOrgReadable = false,
  ): Promise<IPresignedUrl[]> {
    const urls = await Promise.all(
      keys.map(async (key) => ({
        key,
        url: await this.s3Service.getPreSignedGETUrl(key, orgId, isPublic, isAnyOrgReadable),
      })),
    );
    return urls;
  }
}
