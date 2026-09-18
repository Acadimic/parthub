import { Injectable } from '@nestjs/common';
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SecretsService } from '../../secrets/secrets.service';
import { Secrets } from '@secrets/secrets';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private publicBucketName: string;

  constructor(private readonly secretsService: SecretsService) {
    const region = this.secretsService.get<string>(Secrets.AWS_REGION) || 'ap-south-1';
    this.bucketName = this.secretsService.get<string>(Secrets.S3_BUCKET_NAME) || '';
    this.publicBucketName = this.secretsService.get<string>(Secrets.S3_PUBLIC_BUCKET_NAME) || '';

    this.s3Client = new S3Client({
      region,
      // Since SDK 3.729 the client computes a CRC32 for every PutObject by default — including one
      // it only presigns, where the body is empty. The signed URL then carries
      // `x-amz-checksum-crc32=AAAAAA==`, and the browser's real upload fails with a digest mismatch.
      // WHEN_REQUIRED restores the pre-3.729 behaviour: no checksum unless the operation demands one.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: this.secretsService.get<string>(Secrets.AWS_ACCESS_KEY) || '',
        secretAccessKey: this.secretsService.get<string>(Secrets.AWS_SECRET_KEY) || '',
      },
    });
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (!keys.length) return;
    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
      },
    });
    await this.s3Client.send(command);
  }

  async getPreSignedPUTUrl(key: string, contentType: string, isPublic = false): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: isPublic ? this.publicBucketName : this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 1800 });
  }

  async getPreSignedGETUrl(key: string, isPublic = false): Promise<string> {
    if (isPublic) {
      return `https://${this.publicBucketName}.s3.amazonaws.com/${key}`;
    }
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 172800 });
  }
}
