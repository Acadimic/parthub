import { Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { AccountType, Gender, DefaultRole, StorageKey } from '../enums';
import { MappingService, UserService } from '../services';
import { getObjectId } from '../utils/helpers';
import { IOrg, IStandard, IStudentStandardMapping, IUser, Org, StudentStandardMapping, User } from './models';
import { IStore } from './root.store';

export const UserStore = t
  .model({
    userMaps: t.map(User),
    orgMaps: t.map(Org),
    studentStandardMaps: t.map(StudentStandardMapping),
    loggedInUserIds: t.optional(t.array(t.string), []),
    isLoadingUsers: t.optional(t.boolean, false),
    isLoadedUsers: t.optional(t.boolean, false),
    isLoadingLoggedInUsers: t.optional(t.boolean, false),
    isLoadedLoggedInUsers: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    getUserById(userId: string): IUser | undefined {
      return userId ? self.userMaps.get(userId) : undefined;
    },

    getOrgById(orgId: string): IOrg | undefined {
      return orgId ? self.orgMaps.get(orgId) : undefined;
    },

    get users(): IUser[] {
      return Array.from(self.userMaps.values());
    },

    get studentStandardMappings(): IStudentStandardMapping[] {
      return Array.from(self.studentStandardMaps.values());
    },

    removeUserByUserId(userId: string) {
      return self.userMaps.delete(userId);
    },
  }))
  .views((self) => ({
    getUsersByIds(userIds: string[]): IUser[] {
      const users: IUser[] = [];
      userIds.forEach((userId) => {
        const user = self.getUserById(userId);
        if (user) users.push(user);
      });
      return users;
    },

    getStudentStandardMappingsByStudentId(studentId: string): IStudentStandardMapping[] {
      return self.studentStandardMappings.filter((item) => item.student === studentId);
    },
  }))
  .views((self) => ({
    get loggedInUsers(): IUser[] {
      return self.getUsersByIds(self.loggedInUserIds);
    },
  }))
  .actions((self) => ({
    addUser: (user: IUser) => {
      if (!user) return;
      const userId = user._id;
      const isUser = self.userMaps.has(userId);
      if (isUser) self.userMaps.set(userId, user);
      else self.userMaps.put(user);
    },

    addOrg: (org: IOrg) => {
      if (!org) return;
      const orgId = org._id;
      const isOrg = self.orgMaps.has(orgId);
      if (isOrg) self.orgMaps.set(orgId, org);
      else self.orgMaps.put(org);
    },

    addStudentStandardMap: (obj: IStudentStandardMapping) => {
      if (!obj) return;
      const id = obj._id;
      const isPresent = self.studentStandardMaps.has(id);
      if (isPresent) self.studentStandardMaps.set(id, obj);
      else self.studentStandardMaps.put(obj);
    },

    removeNewUsers: () => {
      const newUsers = self.users.filter((user) => user.isNew);
      newUsers.forEach((user) => self.removeUserByUserId(user._id));
    },
  }))
  .actions((self) => ({
    addUsers: (users: IUser[]) => {
      users.forEach((user) => self.addUser(user));
    },

    addOrgs: (orgs: IOrg[]) => {
      orgs.forEach((org) => self.addOrg(org));
    },

    addStudentStandardMaps: (mapItems: IStudentStandardMapping[]) => {
      mapItems.forEach((mapItem) => self.addStudentStandardMap(mapItem));
    },

    getNewUser: (permission: DefaultRole) => {
      const user = User.create({
        _id: getObjectId(),
        firstName: '',
        lastName: '',
        name: '',
        uid: '',
        email: '',
        gender: Gender.OTHER,
        role: '',
        designation: '',
        permission,
        accountType: AccountType.INVITED,
        isUpdated: false,
        isNew: true,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addUser(user);
      return user;
    },
  }))
  .actions((self) => ({
    loadLoggedInUsers: flow(function* () {
      self.isLoadingLoggedInUsers = true;
      try {
        const result = yield UserService.getInitialLoginData();
        if (!result?.data) {
          self.isLoadingLoggedInUsers = false;
          return;
        }
        self.addUsers(result.data.users);
        self.addOrgs(result.data.orgs);
        self.loggedInUserIds = result.data.users.map((user: IUser) => user._id);
        const org = localStorage.getItem(StorageKey.ORGANIZATION);
        let user = org ? self.loggedInUsers.find((u) => u.org === org) : self.loggedInUsers[0];
        user = user || self.loggedInUsers[0];
        self.rootStore.selectorStore.selectUserAndOrgLeader(user);
        self.isLoadedLoggedInUsers = true;
      } catch (error: unknown) {
        console.error('Error:', error);
      } finally {
        self.isLoadingLoggedInUsers = false;
      }
    }),

    loadStudentStandardMappings: flow(function* () {
      try {
        const result = yield MappingService.getOrgStudentStandardMappings();
        if (result?.data) self.addStudentStandardMaps(result.data);
      } catch {}
    }),
  }))
  .actions((self) => ({
    createStudent: () => {
      const student = self.getNewUser(DefaultRole.STUDENT);
      self.rootStore.selectorStore.setSelectedStudentId(student._id);
      return student;
    },

    createCollaborator: (permission: DefaultRole) => {
      const collaborator = self.getNewUser(permission);
      self.rootStore.selectorStore.setSelectedCollaboratorId(collaborator._id);
      return collaborator;
    },
  }))
  .views((self) => ({
    get students() {
      return self.users.filter((user) => user.permission === DefaultRole.STUDENT);
    },

    get collaborators() {
      return self.users.filter((user) => user.permission !== DefaultRole.STUDENT);
    },

    getStudentStandardsByStudentId(studentId: string): IStandard[] {
      const filteredMaps = self.getStudentStandardMappingsByStudentId(studentId);
      const standardIds = filteredMaps.map((item) => item.standard);
      return self.rootStore.standardStore.getStandardsByIds(standardIds);
    },

    getStudentEnrolledDateByStudentId(studentId: string): string {
      const filteredMaps = self.getStudentStandardMappingsByStudentId(studentId);
      return filteredMaps[0]?.enrolledAt || '';
    },
  }));

export type IUserStore = Instance<typeof UserStore>;
