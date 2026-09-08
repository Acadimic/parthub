import { flow, type Instance, types as t } from 'mobx-state-tree';
import { DocumentType, FileExtension, LevelType, LinkType } from '../../enums';
import { ReactionService } from '../../services';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Attachment = t.model('Attachment', {
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
});

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
      isLoadingReactionsCount: t.optional(t.boolean, false),
      isLoadedReactionsCount: t.optional(t.boolean, false),
      reactionsCount: t.optional(t.number, 0),
    }),
  )
  .actions((self) => ({
    setReactionsCount: (reactionsCount: number) => {
      self.reactionsCount = reactionsCount;
    },
  }))
  .actions((self) => ({
    loadReactionsCount: flow(function* () {
      if (!self._id) return;
      self.isLoadingReactionsCount = true;
      const result = yield ReactionService.getReactionsCount(self._id);
      console.log('followers count: ', result);
      self.setReactionsCount(result.data);
      self.isLoadingReactionsCount = false;
      self.isLoadedReactionsCount = true;
    }),
  }));

export type IMaterial = Instance<typeof Material>;
export type IAttachment = Instance<typeof Attachment>;
