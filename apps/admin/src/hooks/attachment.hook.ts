import { DocumentType } from '@enums';
import { CommonService } from '@services';
import { type AttachmentDto } from '@repo/shared/contracts';
import { getFileExtension } from '@repo/shared/utils';
import { errorToast, getObjectId, successToast } from '@utils/helpers';

export const useAttachment = () => {
  const uploadFilesToS3 = async (_id: string, selectedFiles: File[]) => {
    if (!selectedFiles.length) return [];
    try {
      // Generate new keys
      const keys = selectedFiles.map((file: File) => ({
        key: `${_id}/${getObjectId()}`,
        fileType: file.type,
      }));
      // Get presigned Urls
      const { data: presignedUrls } = await CommonService.getPreSignedPUTUrls({ keys });
      // Upload files
      const promises = selectedFiles.map(async (file: File, index: number) =>
        CommonService.uploadWithPreSignedUrl(presignedUrls[index], file),
      );
      await Promise.all(promises);
      const attachments: AttachmentDto[] = selectedFiles.map((file: File, index: number) => ({
        _id: keys[index].key.split('/')[1],
        fileName: file.name,
        url: presignedUrls[index].split('?')[0],
        documentType: DocumentType.FILE,
        fileType: file.type,
        fileExtension: getFileExtension(file.name),
        isUploaded: true,
      }));
      successToast({ message: `${selectedFiles.length} file(s) uploaded successfully!` });
      return attachments;
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Error uploading files!' });
    }
  };

  const getPresignedUrls = async (urls: string[]): Promise<string[]> => {
    try {
      const result = await CommonService.getPreSignedGETUrls(urls);
      return result.data;
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
