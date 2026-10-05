import { DocumentType, LinkType, MaterialType } from '../enums/material.enum';
import { type IMaterialInfo } from '../interfaces/material.interface';

/** The link kinds the learning app plays as video rather than opening as a page. */
export const VIDEO_LINK_TYPES: readonly LinkType[] = [LinkType.YOUTUBE, LinkType.VIDEO];

interface IAttachmentKind {
  documentType: DocumentType;
  linkType?: LinkType | null;
}

/** An uploaded video, or a link to one. `documentType` is the kind; `fileType` is a content type. */
export const isVideoAttachment = (attachment: IAttachmentKind): boolean =>
  attachment.documentType === DocumentType.VIDEO ||
  (attachment.documentType === DocumentType.LINK &&
    !!attachment.linkType &&
    VIDEO_LINK_TYPES.includes(attachment.linkType));

interface IMaterialForInfo {
  durationMins?: number;
  attachments?: IAttachmentKind[];
}

/**
 * The course roll-up's material counts: every lesson is one reading, and every video attached to
 * one counts once. The teaching app, the course agent and the learning app all count with this.
 */
export const getMaterialsInfo = (materials: IMaterialForInfo[]): IMaterialInfo => ({
  durationMins: materials.reduce((total, material) => total + (material.durationMins ?? 0), 0),
  types: {
    [MaterialType.READING]: materials.length,
    [MaterialType.VIDEO]: materials.reduce(
      (total, material) => total + (material.attachments ?? []).filter(isVideoAttachment).length,
      0,
    ),
  },
});
