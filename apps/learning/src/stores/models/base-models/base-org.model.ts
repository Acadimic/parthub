import { types as t } from 'mobx-state-tree';

export const BaseOrgModel = t.model('BaseOrgModel', {
  org: t.string,
});
