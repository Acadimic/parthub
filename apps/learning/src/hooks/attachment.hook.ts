import { type AttachmentDto } from '@repo/shared/contracts';
import { getFileExtension } from '@repo/shared/utils';
import { DocumentType, Subdomain } from '@enums';
import { CommonService } from '@services';
import { useSelectorLookups } from '@stores';
import {
  compressImage,
  createBatcher,
  errorToast,
  getObjectId,
  getToken,
  isSignedAndLive,
  readPresignedUrlCache,
  successToast,
  toAddress,
  writePresignedUrlCache,
} from '@utils/helpers';
import { useState } from 'react';

/**
 * The S3 object key a stored attachment URL points at.
 *
 * An attachment stores the object's address (`https://<bucket>.s3.../<key>`), while the presigned
 * GET route signs object *keys* — it passes each one to `GetObjectCommand` unchanged. A value that
 * is already a key has no scheme and comes back untouched, which is what an older row holds.
 */
const toObjectKey = (url: string): string => toAddress(url).replace(/^https?:\/\/[^/]+\//, '');

/** Module-level so every image on the page shares one batch; see `createBatcher`. */
const signKey = createBatcher<string>(
  async (keys) => {
    const { data: presignedUrls } = await CommonService.getPreSignedGETUrls({ keys });
    return new Map((presignedUrls ?? []).map((presignedUrl) => [presignedUrl.key, presignedUrl.url]));
  },
  { delayMs: 10, maxBatchSize: 100 },
);

export const useAttachment = () => {
  const selectorStore = useSelectorLookups();
  // Never set: the click handler that would drive it is commented out in Attachment.tsx.
  const [isLoadingAttachment] = useState(false);
  const { setSelectedAttachment, setSelectedContent } = selectorStore;

  const uploadFilesToS3 = async (_id: string, originalFiles: File[]): Promise<AttachmentDto[]> => {
    if (!originalFiles.length) return [];
    try {
      const selectedFiles = await Promise.all(originalFiles.map(compressImage));
      // The key groups an entity's objects under its own id, so a user's avatar is findable from
      // the user alone, and the minted half keeps two uploads of the same file apart.
      const files = selectedFiles.map((file: File) => ({
        key: `${_id}/${getObjectId()}`,
        contentType: file.type,
      }));
      const { data: presignedUrls } = await CommonService.getPreSignedPUTUrls({ files });
      // Paired by key rather than by position: the response carries the key precisely so a caller
      // does not have to trust the order.
      const urlByKey = new Map((presignedUrls ?? []).map((presignedUrl) => [presignedUrl.key, presignedUrl.url]));
      await Promise.all(
        selectedFiles.map(async (file: File, index: number) => {
          const presignedUrl = urlByKey.get(files[index].key);
          if (!presignedUrl) throw new Error(`No upload URL was issued for ${file.name}.`);
          return CommonService.uploadWithPreSignedUrl(presignedUrl, file);
        }),
      );
      const attachments: AttachmentDto[] = selectedFiles.map((file: File, index: number) => ({
        key: files[index].key,
        fileName: file.name,
        // The signed URL's query string is the signature and expires; the object's address does not.
        url: (urlByKey.get(files[index].key) ?? '').split('?')[0],
        documentType: DocumentType.FILE,
        fileType: file.type,
        fileExtension: getFileExtension(file.name),
        isUploaded: true,
      }));
      successToast({ message: `${selectedFiles.length} file(s) uploaded successfully!` });
      return attachments;
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Error uploading files!' });
      return [];
    }
  };

  /**
   * Signed URLs in the caller's order, `''` for one that could not be signed. A cached URL that has
   * not expired is used as it is — including those a public route sent for a visitor with no
   * session — which also lets the browser serve the image from its own cache.
   */
  const getPresignedUrls = async (urls: string[]): Promise<string[]> => {
    const cache = readPresignedUrlCache();
    const cached = urls.map((url) => {
      const hit = cache[toAddress(url)];
      return hit && isSignedAndLive(hit) ? hit : '';
    });
    if (cached.every(Boolean)) return cached;
    // The course catalogue is public, so an anonymous visitor renders cards whose images cannot be
    // signed — `common/presigned-GET-urls` is authenticated. Bail quietly and let the caller show
    // its placeholder, rather than raising one error toast per card.
    if (!getToken(Subdomain.LEARN)) return [];
    const signed = await Promise.all(
      urls.map(async (url, index) => cached[index] || ((await signKey(toObjectKey(url))) ?? '')),
    );
    const next = readPresignedUrlCache();
    urls.forEach((url, index) => {
      if (signed[index] && !cached[index]) next[toAddress(url)] = signed[index];
    });
    writePresignedUrlCache(next);
    return signed;
  };

  const handleClickAttachment = async (attachment: AttachmentDto) => {
    if (!attachment) return;
    setSelectedAttachment(attachment);
    setSelectedContent(null);
  };

  return {
    isLoadingAttachment,
    handleClickAttachment,
    uploadFilesToS3,
    getPresignedUrls,
  };
};
