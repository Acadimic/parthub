import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { DocumentType, FileExtension, LevelType, LinkType } from '../../enums';
import { getSlug } from '../../utils/helpers';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Attachment = t
  .model('Attachment', {
    _id: t.identifier,
    fileName: t.string,
    url: t.string,
    documentType: t.enumeration('DocumentType', Object.values(DocumentType)),
    fileType: t.string,
    fileExtension: t.enumeration('FileExtension', Object.values(FileExtension)),
    linkType: t.maybeNull(t.enumeration('LinkType', Object.values(LinkType))),
    reference: t.optional(t.string, ''),
    tag: t.optional(t.string, ''),
    isUploaded: t.optional(t.boolean, false),
    isNew: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    setFileName: (fileName: string) => {
      self.fileName = fileName;
    },

    setUrl: (url: string) => {
      if (self.isUploaded) return;
      self.url = url;
    },

    setLinkType: (linkType: LinkType) => {
      if (self.isUploaded) return;
      self.linkType = linkType;
    },
  }));

export const Material = t
  .compose(
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
      attachments: t.optional(t.array(Attachment), []),
      level: t.enumeration('LevelType', Object.values(LevelType)),
      tag: t.optional(t.string, ''),
      durationMins: t.number, // read/watch time in minutes
      isNew: t.optional(t.boolean, false),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
      self.slug = getSlug(name);
    },

    setContent: (content: string) => {
      self.content = content;
    },

    setChapter: (chapter: string | null) => {
      self.chapter = chapter;
    },

    resetIsNew: () => {
      self.isNew = false;
    },

    setStandard: (standardId: string) => {
      self.standard = standardId;
    },

    setSubject: (subjectId: string) => {
      self.subject = subjectId;
    },

    addAttachment: (doc: IAttachment) => {
      self.attachments.push(doc);
    },

    removeAttachment: (doc: IAttachment) => {
      const index = self.attachments.findIndex((attachment) => attachment._id === doc._id);
      if (index !== -1) {
        self.attachments.splice(index, 1);
      }
    },
  }));

export type IMaterial = Instance<typeof Material>;
export type IAttachment = Instance<typeof Attachment>;
