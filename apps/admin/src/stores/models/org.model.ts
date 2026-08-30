import { Instance, SnapshotIn, SnapshotOut, types as t } from 'mobx-state-tree';
import { OrgType } from '../../enums';
import { BaseOwnerModel } from './base-models';

export const Org = t.compose(
  BaseOwnerModel,
  t.model('Org', {
    _id: t.identifier,
    name: t.string,
    orgType: t.enumeration('orgType', Object.values(OrgType)),
  }),
);

export type IOrg = Instance<typeof Org>;
export type IOrgSnapshotIn = SnapshotIn<typeof Org>;
export type IOrgSnapshotOut = SnapshotOut<typeof Org>;
