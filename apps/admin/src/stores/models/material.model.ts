import { Instance, types as t } from 'mobx-state-tree';
import { ContentType, DocumentType, FileExtension, LevelType, LinkType } from '../../enums';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Attachment = t.model('Attachment', {
  _id: t.identifier,
  fileName: t.string,
  url: t.string,
  documentType: t.enumeration('DocumentType', Object.values(DocumentType)),
  fileType: t.string,
  fileExtension: t.enumeration('FileExtension', Object.values(FileExtension)),
  linkType: t.maybeNull(t.enumeration('linkType', Object.values(LinkType))),
  reference: t.optional(t.string, ''),
  tag: t.optional(t.string, ''),
  isUploaded: t.optional(t.boolean, false),
});

export const Material = t.compose(
  BaseTimestampModel,
  BaseOrgOwnerModel,
  t.model('Material', {
    _id: t.identifier,
    name: t.string,
    slug: t.string,
    standard: t.string,
    subject: t.string,
    order: t.number,
    content: t.optional(t.string, ''),
    chapter: t.maybeNull(t.string),
    links: t.optional(t.array(Attachment), []),
    attachments: t.optional(t.array(Attachment), []),
    contentType: t.enumeration('ContentType', [...Object.values(ContentType), '']),
    level: t.enumeration('LevelType', Object.values(LevelType)),
    tag: t.optional(t.string, ''),
    durationMins: t.number, // read/watch time in minutes
    isNew: t.optional(t.boolean, false),
  }),
);

export type IMaterial = Instance<typeof Material>;
export type IAttachment = Instance<typeof Attachment>;
