import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Secrets } from '@secrets/secrets';
import { SecretsService } from '../../secrets/secrets.service';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private region: string;
  private bucketName: string;
  private publicBucketName: string;
  /**
   * The folder every object of this deployment lives under, always ending in a slash. Callers pass
   * bare keys (`<entity id>/<object id>`) and store bare keys; the prefix is applied here on the
   * way in and out, so one bucket can serve several deployments — or share space with another
   * project — without any of them seeing the others' files.
   */
  private prefix: string;

  constructor(private readonly secretsService: SecretsService) {
    const region = this.secretsService.get<string>(Secrets.AWS_REGION) || 'ap-south-1';
    this.region = region;
    this.bucketName = this.secretsService.get<string>(Secrets.S3_BUCKET_NAME) || '';
    this.publicBucketName = this.secretsService.get<string>(Secrets.S3_PUBLIC_BUCKET_NAME) || '';
    this.prefix = S3Service.normalisePrefix(this.secretsService.get<string>(Secrets.S3_PREFIX) || '');

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

  /** "acadimic-dev", "/acadimic-dev/" and "acadimic-dev/" all mean the same folder; empty means the bucket root. */
  static normalisePrefix(value: string): string {
    const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
    return trimmed ? `${trimmed}/` : '';
  }

  /**
   * Where a key lives in the bucket, and whether the caller may touch it.
   *
   * Every object belongs to an organization. Under the deployment prefix it sits in
   * `orgs/<org id>/`, and a bare key — `<entity id>/<object id>` — is placed there. A stored key
   * that already carries the folder is checked instead: only the caller's own organization may
   * write it. A private route is no exception, because it runs as the service account in
   * `PRIVATE_API_EMAIL` and therefore has an organization like any other caller.
   *
   * `isAnyOrgReadable` lifts the ownership check for the read path. Standards, subjects and
   * published courses are platform reference data every app renders, and their files sit in
   * whichever organization uploaded them, so a read cannot be scoped to the caller's own.
   */
  resolveKey(key: string, orgId: string, isAnyOrgReadable = false): string {
    const bare = key.replace(/^\/+/, '');
    const relative = this.prefix && bare.startsWith(this.prefix) ? bare.slice(this.prefix.length) : bare;
    const isStored = relative.startsWith(`${S3Service.ORG_FOLDER}/`);
    if (!isStored) return `${this.prefix}${S3Service.ORG_FOLDER}/${orgId}/${relative}`;
    const isAllowed = isAnyOrgReadable || relative.startsWith(`${S3Service.ORG_FOLDER}/${orgId}/`);
    if (!isAllowed) throw new ForbiddenException('That file belongs to another organization.');
    return `${this.prefix}${relative}`;
  }

  private static readonly ORG_FOLDER = 'orgs';

  async deleteObjects(keys: string[], orgId: string): Promise<void> {
    if (!keys.length) return;
    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: this.resolveKey(key, orgId) })),
      },
    });
    await this.s3Client.send(command);
  }

  async getPreSignedPUTUrl(key: string, contentType: string, orgId: string, isPublic = false): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: isPublic ? this.publicBucketName : this.bucketName,
      Key: this.resolveKey(key, orgId),
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 1800 });
  }

  async getPreSignedGETUrl(key: string, orgId: string, isPublic = false, isAnyOrgReadable = false): Promise<string> {
    const resolved = this.resolveKey(key, orgId, isAnyOrgReadable);
    // The regional host: the bare `s3.amazonaws.com` form redirects outside us-east-1, and a
    // redirected image request is one a browser may refuse.
    if (isPublic) return `https://${this.publicBucketName}.s3.${this.region}.amazonaws.com/${resolved}`;
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: resolved,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 172800 });
  }
}
