import { createContext, useContext } from 'react';

/** What an upload hands back: the address the image node stores as its `src`. */
export interface IUploadedImage {
  src: string;
}

/**
 * How authored content reaches the bucket. Each app provides it at its root, because signing and
 * uploading go through the app's own HTTP layer, which this package must not import.
 *
 * `resolveMediaUrl` turns a stored `src` into something an `<img>` or `<audio>` can load (a signed URL for an
 * object of ours, the address itself for anything else, `''` when it cannot be shown).
 * `uploadImage` is absent where content is only read, and the editor then offers no image button.
 */
export interface IRichTextMedia {
  resolveMediaUrl: (src: string) => Promise<string>;
  uploadImage?: (file: File) => Promise<IUploadedImage>;
}

/** Without a provider, only plain `https:` addresses outside our bucket can be shown. */
const DEFAULT_MEDIA: IRichTextMedia = {
  resolveMediaUrl: async (src) => (/^https:\/\//.test(src) && !/\.amazonaws\.com\//.test(src) ? src : ''),
};

export const RichTextMediaContext = createContext<IRichTextMedia>(DEFAULT_MEDIA);

export const useRichTextMedia = (): IRichTextMedia => useContext(RichTextMediaContext);
