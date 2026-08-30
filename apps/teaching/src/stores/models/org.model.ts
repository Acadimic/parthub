import { Instance, SnapshotIn, SnapshotOut, types as t } from 'mobx-state-tree';
import { OrgType } from '../../enums';
import { BaseOwnerModel } from './base-models';

export const Org = t.compose(
  BaseOwnerModel,
  t.model('Org', {
    _id: t.identifier,
    name: t.string,
    logo: t.maybeNull(t.string),
    orgType: t.enumeration('OrgType', Object.values(OrgType)),
  }),
);

export interface IOrg extends Instance<typeof Org> {}
export interface IOrgSnapshotIn extends SnapshotIn<typeof Org> {}
export interface IOrgSnapshotOut extends SnapshotOut<typeof Org> {}
