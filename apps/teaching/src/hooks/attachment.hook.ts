import { type AttachmentDto } from '@repo/shared/contracts';
import { getFileExtension } from '@repo/shared/utils';
import { DocumentType, StorageKey } from '@enums';
import { isExternalUrl } from '@repo/ui/lib';
import { CommonService } from '@services';
import { compressImage, createBatcher, errorToast, getObjectId, isPresignedUrlExpired } from '@utils/helpers';

/**
 * The S3 object key a stored attachment URL points at.
 *
 * An attachment stores the object's address (`https://<bucket>.s3.../<key>`), while the presigned
 * GET route signs object *keys* — it passes each one to `GetObjectCommand` unchanged. A value that
 * is already a key has no scheme and comes back untouched, which is what an older row holds.
 */
const toObjectKey = (url: string): string => url.replace(/^https?:\/\/[^/]+\//, '');

/** Module-level so every image on the page shares one batch; see `createBatcher`. */
const signKey = createBatcher<string>(
  async (keys) => {
    const { data: presignedUrls } = await CommonService.getPreSignedGETUrls({ keys });
    return new Map((presignedUrls ?? []).map((presignedUrl) => [presignedUrl.key, presignedUrl.url]));
  },
  { delayMs: 10, maxBatchSize: 100 },
);

const readPresignedUrlCache = (): Record<string, string> =>
  JSON.parse(localStorage.getItem(StorageKey.PRESIGNED_URLS) || '{}');

/** Per-file upload progress, 0–100, by position in the staged list. */
export type UploadProgress = Record<number, number>;

export const useAttachment = () => {
  /**
   * Uploads staged files and returns their attachment records.
   *
   * Files go up one at a time so the progress a form shows is a real one. If any upload fails,
   * the objects already written are deleted again and the error is rethrown: the caller's save
   * stops, and the bucket holds nothing that no record points at.
   */
  const uploadFilesToS3 = async (
    _id: string,
    originalFiles: File[],
    onProgress?: (index: number, percent: number) => void,
  ): Promise<AttachmentDto[]> => {
    if (!originalFiles.length) return [];
    const selectedFiles = await Promise.all(originalFiles.map(compressImage));
    // The key groups an entity's objects under its own id, so a course's images are findable from
    // the course alone, and the minted half keeps two uploads of the same file apart.
    const files = selectedFiles.map((file: File) => ({
      key: `${_id}/${getObjectId()}`,
      contentType: file.type,
      size: file.size,
    }));
    const { data: presignedUrls } = await CommonService.getPreSignedPUTUrls({ files });
    // Paired by key rather than by position: the response carries the key precisely so a caller
    // does not have to trust the order.
    const urlByKey = new Map((presignedUrls ?? []).map((presignedUrl) => [presignedUrl.key, presignedUrl.url]));
    const uploaded: AttachmentDto[] = [];
    try {
      for (const [index, file] of selectedFiles.entries()) {
        const presignedUrl = urlByKey.get(files[index].key);
        if (!presignedUrl) throw new Error(`No upload URL was issued for ${file.name}.`);
        onProgress?.(index, 0);
        await CommonService.uploadWithPreSignedUrl(presignedUrl, file, (percent) => onProgress?.(index, percent));
        uploaded.push({
          key: files[index].key,
          fileName: file.name,
          // The signed URL's query string is the signature and expires; the object's address does not.
          url: presignedUrl.split('?')[0],
          documentType: DocumentType.FILE,
          fileType: file.type,
          fileExtension: getFileExtension(file.name),
          isUploaded: true,
        });
      }
    } catch (error) {
      await deleteAttachments(uploaded);
      errorToast({
        message: (error as Error)?.message || 'A file could not be uploaded.',
        description: 'Nothing was saved.',
      });
      throw error;
    }
    return uploaded;
  };

  /** Deletes the objects behind uploaded attachments. Links have nothing in the bucket and are skipped. */
  const deleteAttachments = async (attachments: AttachmentDto[]): Promise<void> => {
    const keys = attachments
      .filter((attachment) => attachment.isUploaded && attachment.url)
      .map((attachment) => toObjectKey(attachment.url));
    if (!keys.length) return;
    try {
      await CommonService.deleteObjects(keys);
    } catch {
      // Already reported by the HTTP layer; a leftover object is not worth blocking the save over.
    }
  };

  /**
   * Signed URLs in the caller's order, `''` for one that could not be signed. A cached URL that has
   * not expired is reused, which also lets the browser serve the image from its own cache.
   */
  const getPresignedUrls = async (urls: string[]): Promise<string[]> => {
    const cache = readPresignedUrlCache();
    const cached = urls.map((url) => (cache[url] && !isPresignedUrlExpired(cache[url]) ? cache[url] : ''));
    if (cached.every(Boolean)) return cached;
    const signed = await Promise.all(
      urls.map(async (url, index) => {
        if (cached[index]) return cached[index];
        if (isExternalUrl(url)) return url;
        return (await signKey(toObjectKey(url))) ?? '';
      }),
    );
    const next = readPresignedUrlCache();
    urls.forEach((url, index) => {
      if (signed[index] && !cached[index]) next[url] = signed[index];
    });
    localStorage.setItem(StorageKey.PRESIGNED_URLS, JSON.stringify(next));
    return signed;
  };

  return {
    uploadFilesToS3,
    deleteAttachments,
    getPresignedUrls,
  };
};
