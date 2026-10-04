import { type IRichTextMedia } from '@repo/ui/contexts';
import { isExternalUrl } from '@repo/ui/lib';
import { FIGURE_REF_PREFIX } from '@repo/shared/utils';
import { useMemo } from 'react';
import { useAttachment } from './attachment.hook';

/** Content is only read here, so pictures are signed for display and never uploaded. */
export const useRichTextMediaValue = (): IRichTextMedia => {
  const { getPresignedUrls } = useAttachment();
  return useMemo(
    () => ({
      imageLoading: 'lazy',
      resolveMediaUrl: async (src: string) => {
        if (!src || src.startsWith(FIGURE_REF_PREFIX)) return '';
        if (isExternalUrl(src)) return src;
        const [url] = await getPresignedUrls([src]);
        return url ?? '';
      },
    }),
    // The attachment helpers hold no state, so one value serves the app's lifetime.
    [],
  );
};
