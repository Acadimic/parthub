import { ArrayMaxSize, ArrayMinSize, IsArray, IsUrl } from 'class-validator';

/** The addresses an AI import wants checked before it stores them as references. */
export class VerifyLinksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  urls: string[];
}
