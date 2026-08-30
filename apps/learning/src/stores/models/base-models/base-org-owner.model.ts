import { Instance, types as t } from 'mobx-state-tree';
import { BaseOrgModel } from './base-org.model';
import { BaseOwnerModel } from './base-owner.model';

export const BaseOrgOwnerModel = t.compose(BaseOrgModel, BaseOwnerModel);

export interface IBaseOrgOwnerModel extends Instance<typeof BaseOrgOwnerModel> {}
