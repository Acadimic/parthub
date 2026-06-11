import { Instance, flow, types as t } from 'mobx-state-tree';
import UserService from '../services/user.service';

const UserModel = t.model('UserModel', {
  _id: t.identifier,
  name: t.optional(t.string, ''),
  email: t.optional(t.string, ''),
  permission: t.optional(t.string, ''),
  org: t.optional(t.string, ''),
});

export const UserStore = t
  .model('UserStore', {
    userMaps: t.map(UserModel),
    loggedInUser: t.maybe(t.reference(UserModel)),
    isLoadingLoggedInUsers: t.optional(t.boolean, false),
    isLoadedLoggedInUsers: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    addUsers: (users: any[]) => {
      users?.forEach((u: any) => {
        if (u?._id) self.userMaps.set(u._id, u);
      });
    },
    loadLoggedInUsers: flow(function* () {
      self.isLoadingLoggedInUsers = true;
      try {
        const result = yield UserService.getInitialLoginData();
        const data = result?.data;
        if (data?.user) {
          self.userMaps.set(data.user._id, data.user);
          self.loggedInUser = data.user._id;
        }
      } catch (e) {
        console.error(e);
      }
      self.isLoadedLoggedInUsers = true;
      self.isLoadingLoggedInUsers = false;
    }),
  }));

export type IUserStore = Instance<typeof UserStore>;
