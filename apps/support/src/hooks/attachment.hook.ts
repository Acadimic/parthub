import { DocumentType } from '@enums';
import { CommonService } from '@services';
import { type AttachmentDto } from '@repo/shared/contracts';
import { getFileExtension } from '@repo/shared/utils';
import { errorToast, getObjectId, successToast } from '@utils/helpers';

/**
 * The S3 object key a stored attachment URL points at.
 *
 * An attachment stores the object's address (`https://<bucket>.s3.../<key>`), while the presigned
 * GET route signs object *keys* — it passes each one to `GetObjectCommand` unchanged. A value that
 * is already a key has no scheme and comes back untouched, which is what an older row holds.
 */
const toObjectKey = (url: string): string => url.replace(/^https?:\/\/[^/]+\//, '');

export const useAttachment = () => {
  const uploadFilesToS3 = async (_id: string, selectedFiles: File[]): Promise<AttachmentDto[]> => {
    if (!selectedFiles.length) return [];
    try {
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

  const getPresignedUrls = async (urls: string[]): Promise<string[]> => {
    try {
      const keys = urls.map(toObjectKey);
      const { data: presignedUrls } = await CommonService.getPreSignedGETUrls({ keys });
      const urlByKey = new Map((presignedUrls ?? []).map((presignedUrl) => [presignedUrl.key, presignedUrl.url]));
      // Back into the caller's order, with the key as the join — an object the server could not
      // sign is simply absent from the response rather than shifting every later entry.
      return keys.map((key: string) => urlByKey.get(key) ?? '');
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Error fetching presigned URL!' });
      return [];
    }
  };

  return {
    uploadFilesToS3,
    getPresignedUrls,
  };
};
