import { DocumentType, LinkType, StorageKey } from '@enums';
import { CommonService } from '@services';
import { type IAttachment } from '@stores';
import { errorToast, getObjectId, isPresignedUrlExpired, successToast } from '@utils/helpers';

export const useAttachment = () => {
  const uploadFilesToS3 = async (_id: string, selectedFiles: File[]) => {
    if (!selectedFiles.length) return null;
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
      const attachments: IAttachment[] = selectedFiles.map(
        (file: File, index: number) =>
          ({
            _id: keys[index].key.split('/')[1],
            fileName: file.name,
            url: presignedUrls[index].split('?')[0],
            documentType: DocumentType.FILE,
            fileType: file.type,
            fileExtension: file.name.split('.').pop(),
            linkType: LinkType.OTHER,
            isUploaded: true,
          }) as IAttachment,
      );
      successToast({ message: `${selectedFiles.length} file(s) uploaded successfully!` });
      return attachments;
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Error uploading files!' });
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
      const { data: presignedUrls } = await CommonService.getPreSignedGETUrls(urls);
      presignedUrlMaps = JSON.parse(localStorage.getItem(StorageKey.PRESIGNED_URLS) || '{}');
      urls.forEach((url: string, index: number) => {
        presignedUrlMaps[url] = presignedUrls[index];
      });
      localStorage.setItem(StorageKey.PRESIGNED_URLS, JSON.stringify(presignedUrlMaps));
      return presignedUrls;
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
