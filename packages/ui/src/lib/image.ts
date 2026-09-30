import { IS_WINDOW_UNDEFINED } from './util';

/** The longest side an uploaded photo keeps: full HD, larger than anything the apps display. */
const MAX_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 0.85;
/** Below this a file is already cheap to load, and re-encoding would only cost quality. */
const MIN_BYTES_TO_COMPRESS = 200 * 1024;
// GIF would lose its animation and SVG is vector, so both are uploaded as they are.
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

/**
 * Downscales a photo to fit `MAX_IMAGE_DIMENSION` and re-encodes it as WebP before upload. Returns
 * the original file for anything else, when the browser cannot encode WebP, or when the result
 * would not be smaller, so a caller can always upload what comes back.
 */
export const compressImage = async (file: File): Promise<File> => {
  if (IS_WINDOW_UNDEFINED || !COMPRESSIBLE_TYPES.includes(file.type) || file.size < MIN_BYTES_TO_COMPRESS) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
    // A browser that cannot encode WebP hands back a PNG instead.
    if (blob?.type !== 'image/webp' || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, '')}.webp`;
    return new File([blob], name, { type: 'image/webp', lastModified: file.lastModified });
  } catch {
    return file;
  }
};
