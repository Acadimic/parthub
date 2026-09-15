import { type IPresignedUrl } from '@repo/shared/contracts';
import { Injectable } from '@nestjs/common';
import { S3Service } from '@modules/s3/s3.service';
import { PresignedPutUrlDto } from './dto/presigned-url.dto';

@Injectable()
export class CommonService {
  constructor(private readonly s3Service: S3Service) {}

  async getPreSignedPUTUrls(files: PresignedPutUrlDto[], isPublic = false): Promise<IPresignedUrl[]> {
    const urls = await Promise.all(
      files.map(async (file) => ({
        key: file.key,
        url: await this.s3Service.getPreSignedPUTUrl(file.key, file.contentType, isPublic),
      })),
    );
    return urls;
  }

  async getPreSignedGETUrls(keys: string[], isPublic = false): Promise<IPresignedUrl[]> {
    const urls = await Promise.all(
      keys.map(async (key) => ({
        key,
        url: await this.s3Service.getPreSignedGETUrl(key, isPublic),
      })),
    );
    return urls;
  }
}
