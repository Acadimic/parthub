import { type AttachmentDto } from '@repo/shared/contracts';
import { getFileExtension } from '@repo/shared/utils';
import { DocumentType, StorageKey } from '@enums';
import { CommonService } from '@services';
import { errorToast, getObjectId, isPresignedUrlExpired } from '@utils/helpers';

/**
 * The S3 object key a stored attachment URL points at.
 *
 * An attachment stores the object's address (`https://<bucket>.s3.../<key>`), while the presigned
 * GET route signs object *keys* — it passes each one to `GetObjectCommand` unchanged. A value that
 * is already a key has no scheme and comes back untouched, which is what an older row holds.
 */
const toObjectKey = (url: string): string => url.replace(/^https?:\/\/[^/]+\//, '');

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
    selectedFiles: File[],
    onProgress?: (index: number, percent: number) => void,
  ): Promise<AttachmentDto[]> => {
    if (!selectedFiles.length) return [];
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

  const getPresignedUrls = async (urls: string[]): Promise<string[]> => {
    let presignedUrlMaps = JSON.parse(localStorage.getItem(StorageKey.PRESIGNED_URLS) || '{}');
    const existingPresignedUrls = urls
      .map((url: string) => {
        const existingPresignedUrl = presignedUrlMaps[url];
        const isExpired = isPresignedUrlExpired(existingPresignedUrl);
        if (existingPresignedUrl && !isExpired) return existingPresignedUrl;
        return null;
      })
      .filter(Boolean);
    if (existingPresignedUrls.length === urls.length) return existingPresignedUrls;
    try {
      const keys = urls.map(toObjectKey);
      const { data: presignedUrls } = await CommonService.getPreSignedGETUrls({ keys });
      const urlByKey = new Map((presignedUrls ?? []).map((presignedUrl) => [presignedUrl.key, presignedUrl.url]));
      // Back into the caller's order, with the key as the join — an object the server could not
      // sign is simply absent from the response rather than shifting every later entry.
      const signedUrls = keys.map((key: string) => urlByKey.get(key) ?? '');
      presignedUrlMaps = JSON.parse(localStorage.getItem(StorageKey.PRESIGNED_URLS) || '{}');
      urls.forEach((url: string, index: number) => {
        if (signedUrls[index]) presignedUrlMaps[url] = signedUrls[index];
      });
      localStorage.setItem(StorageKey.PRESIGNED_URLS, JSON.stringify(presignedUrlMaps));
      return signedUrls;
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Error fetching presigned URL!' });
      return [];
    }
  };

  return {
    uploadFilesToS3,
    deleteAttachments,
    getPresignedUrls,
  };
};
