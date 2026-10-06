import { ArrayMaxSize, IsArray, IsMongoId } from 'class-validator';
import { MAX_MATERIAL_IDS } from '../../../utils/material-stats.util';

/** The body for "give me these lessons in full", which list routes send without their bodies. */
export class MaterialIdsDto {
  @IsArray()
  @ArrayMaxSize(MAX_MATERIAL_IDS)
  @IsMongoId({ each: true })
  ids: string[];
}
