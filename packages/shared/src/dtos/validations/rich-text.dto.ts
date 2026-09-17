import { IsEnum, IsObject, IsString } from 'class-validator';
import { RichTextFormat } from '../../enums';
import type { IRichTextDoc } from '../../interfaces';

/**
 * The wire shape of authored content, used by every field that holds it.
 *
 * `doc` is validated only as "an object" here on purpose. class-validator cannot express a
 * recursive node tree without a class per node type, which would restate the editor's schema in a
 * second place; the real structural check is `Schema.nodeFromJSON()` on the server, which validates
 * against the actual schema and fails on anything it cannot build.
 */
export class RichTextDto {
  @IsEnum(RichTextFormat)
  format: RichTextFormat;

  @IsObject()
  doc: IRichTextDoc;

  /** Plain-text projection, denormalised on write. Search and list previews read this. */
  @IsString()
  text: string;
}
