import { type IAiFigure } from '@repo/shared/interfaces';
import { type IRichTextMedia } from '@repo/ui/contexts';
import { isExternalUrl } from '@repo/ui/lib';
import { FIGURE_REF_PREFIX } from '@repo/shared/utils';
import { CommonService } from '@services';
import { compressImage, getObjectId } from '@utils/helpers';
import { useMemo } from 'react';
import { useAttachment } from './attachment.hook';

/**
 * Pictures in authored content go to the organization's `content/` folder the moment they are
 * inserted, so the document can hold the address straight away. A picture removed before the
 * record is saved is left in the bucket; it is small, and nothing points at it.
 */
export const useRichTextMediaValue = (): IRichTextMedia => {
  const { getPresignedUrls } = useAttachment();
  return useMemo(
    () => ({
      resolveMediaUrl: async (src: string) => {
        if (!src || src.startsWith(FIGURE_REF_PREFIX)) return '';
        if (isExternalUrl(src)) return src;
        const [url] = await getPresignedUrls([src]);
        return url ?? '';
      },
      uploadImage: async (original: File) => {
        const file = await compressImage(original);
        const key = `content/${getObjectId()}`;
        const { data } = await CommonService.getPreSignedPUTUrls({
          files: [{ key, contentType: file.type, size: file.size }],
        });
        const presignedUrl = data?.find((item) => item.key === key)?.url;
        if (!presignedUrl) throw new Error('No upload URL was issued for the image.');
        await CommonService.uploadWithPreSignedUrl(presignedUrl, file);
        // The query string is the signature and expires; the object's address does not.
        return { src: presignedUrl.split('?')[0] };
      },
    }),
    // The attachment helpers hold no state, so one value serves the app's lifetime.
    [],
  );
};

/**
 * Uploads the figures an AI reply drew and returns each ref's address, for `withFigureSources`.
 * Called just before an import writes, so a reply that is never imported uploads nothing.
 */
export const uploadAiFigures = async (figures: IAiFigure[]): Promise<Map<string, string>> => {
  const srcByRef = new Map<string, string>();
  for (const figure of figures) {
    const file = new File([figure.svg.trim()], `${figure.ref}.svg`, { type: 'image/svg+xml' });
    const key = `content/${getObjectId()}.svg`;
    const { data } = await CommonService.getPreSignedPUTUrls({
      files: [{ key, contentType: file.type, size: file.size }],
    });
    const presignedUrl = data?.find((item) => item.key === key)?.url;
    if (!presignedUrl) throw new Error(`No upload URL was issued for figure ${figure.ref}.`);
    await CommonService.uploadWithPreSignedUrl(presignedUrl, file);
    srcByRef.set(figure.ref, presignedUrl.split('?')[0]);
  }
  return srcByRef;
};
