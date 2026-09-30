import { DocumentType } from '@enums';
import { CommonService } from '@services';
import { type AttachmentDto } from '@repo/shared/contracts';
import { getFileExtension } from '@repo/shared/utils';
import { compressImage, createBatcher, errorToast, getObjectId, successToast } from '@utils/helpers';

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

export const useAttachment = () => {
  const uploadFilesToS3 = async (_id: string, originalFiles: File[]): Promise<AttachmentDto[]> => {
    if (!originalFiles.length) return [];
    try {
      const selectedFiles = await Promise.all(originalFiles.map(compressImage));
      // The key groups an entity's objects under its own id, so a standard's logo is findable from
      // the standard alone, and the minted half keeps two uploads of the same file apart.
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

  /** Signed URLs in the caller's order, `''` for one that could not be signed. */
  const getPresignedUrls = async (urls: string[]): Promise<string[]> =>
    Promise.all(urls.map(async (url) => (await signKey(toObjectKey(url))) ?? ''));

  return {
    uploadFilesToS3,
    getPresignedUrls,
  };
};
