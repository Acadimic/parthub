import {
  type ClientEntity,
  type IRequestSlice,
  type OrgDto,
  type StudentStandardMappingDto,
  type UserDto,
  createRequestSlice,
} from '@repo/shared';
import { type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { AccountType, DefaultRole, Gender, StorageKey } from '../enums';
import { MappingService, UserService } from '../services';
import { capitalize } from '../utils/helpers';
import { getObjectId } from '../utils/helpers';
import { useSelectorStore } from './selector.store';
import { type IStandard, useStandardStore } from './standard.store';

/**
 * A user in the store. `photoUrl` is client-only — the API sends `avatar` — and is stripped from
 * every request by `CLIENT_ONLY_KEYS`.
 */
export type IUser = ClientEntity<UserDto> & { photoUrl?: string | null };
export type IOrg = ClientEntity<OrgDto>;
export type IStudentStandardMapping = ClientEntity<StudentStandardMappingDto>;

/** Whether a user is a student. Was the `isStudent` view on the MST model. */
export const isStudentUser = (user: IUser): boolean => user.permission === DefaultRole.STUDENT;

/** The fetches this store tracks. */
type UserFetch = 'loggedInUsers' | 'users' | 'studentStandardMappings';

export interface IUserState extends IRequestSlice<UserFetch> {
  userMap: Record<string, IUser>;
  orgMap: Record<string, IOrg>;
  studentStandardMap: Record<string, IStudentStandardMapping>;
  loggedInUserIds: string[];

  getUserById: (userId: string) => IUser | undefined;
  getOrgById: (orgId: string) => IOrg | undefined;
  getUsers: () => IUser[];
  getUsersByIds: (userIds: string[]) => IUser[];
  getLoggedInUsers: () => IUser[];
  getStudents: () => IUser[];
  getCollaborators: () => IUser[];
  getStudentItems: () => ISelectItem[];
  getCollaboratorItems: () => ISelectItem[];
  getStudentStandardMappings: () => IStudentStandardMapping[];
  getStudentStandardMappingsByStudentId: (studentId: string) => IStudentStandardMapping[];
  getStudentStandardsByStudentId: (studentId: string) => IStandard[];
  getStudentEnrolledDateByStudentId: (studentId: string) => string;

  addUsers: (users: IUser[]) => void;
  addOrgs: (orgs: IOrg[]) => void;
  addStudentStandardMaps: (mappings: IStudentStandardMapping[]) => void;
  patchUser: (userId: string, fields: Partial<IUser>) => void;
  /** Sets a name part and keeps the joined `name` in step — the model's setters did both. */
  setUserName: (userId: string, parts: { firstName?: string; lastName?: string }) => void;
  removeUserByUserId: (userId: string) => void;
  removeNewUsers: () => void;

  /** Adds an unsaved user with the given permission and returns it, for the caller to select. */
  createUser: (permission: DefaultRole) => IUser;

  loadLoggedInUsers: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadStudentStandardMappings: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

const toUserItem = (user: IUser): ISelectItem => ({
  label: user.name,
  value: user._id,
  description: `${capitalize(user.role)} (${user.email})`,
  group: `${user.permission}s`,
});

export const useUserStore = create<IUserState>()((set, get) => ({
  userMap: {},
  orgMap: {},
  studentStandardMap: {},
  loggedInUserIds: [],
  ...createRequestSlice(['loggedInUsers', 'users', 'studentStandardMappings'], set, get),

  getUserById: (userId) => (userId ? get().userMap[userId] : undefined),

  getOrgById: (orgId) => (orgId ? get().orgMap[orgId] : undefined),

  getUsers: () => Object.values(get().userMap),

  getUsersByIds: (userIds) => {
    const { userMap } = get();
    return userIds.map((userId) => userMap[userId]).filter((user): user is IUser => !!user);
  },

  getLoggedInUsers: () => get().getUsersByIds(get().loggedInUserIds),

  getStudents: () => get().getUsers().filter(isStudentUser),

  getCollaborators: () =>
    get()
      .getUsers()
      .filter((user) => !isStudentUser(user)),

  getStudentItems: () => get().getStudents().map(toUserItem),

  getCollaboratorItems: () => get().getCollaborators().map(toUserItem),

  getStudentStandardMappings: () => Object.values(get().studentStandardMap),

  getStudentStandardMappingsByStudentId: (studentId) =>
    get()
      .getStudentStandardMappings()
      .filter((mapping) => mapping.student === studentId),

  getStudentStandardsByStudentId: (studentId) => {
    const standardIds = get()
      .getStudentStandardMappingsByStudentId(studentId)
      .map((mapping) => mapping.standard);
    return useStandardStore.getState().getStandardsByIds(standardIds);
  },

  getStudentEnrolledDateByStudentId: (studentId) =>
    get().getStudentStandardMappingsByStudentId(studentId)[0]?.enrolledAt ?? '',

  addUsers: (users) => {
    set((state) => ({ userMap: { ...state.userMap, ...keyById(users) } }));
  },

  addOrgs: (orgs) => {
    set((state) => ({ orgMap: { ...state.orgMap, ...keyById(orgs) } }));
  },

  addStudentStandardMaps: (mappings) => {
    set((state) => ({ studentStandardMap: { ...state.studentStandardMap, ...keyById(mappings) } }));
  },

  patchUser: (userId, fields) => {
    set((state) => {
      const user = state.userMap[userId];
      if (!user) return state;
      return { userMap: { ...state.userMap, [userId]: { ...user, ...fields } } };
    });
  },

  setUserName: (userId, parts) => {
    const user = get().getUserById(userId);
    if (!user) return;
    const firstName = parts.firstName ?? user.firstName ?? '';
    const lastName = parts.lastName ?? user.lastName ?? '';
    get().patchUser(userId, { firstName, lastName, name: `${firstName.trim()} ${lastName.trim()}`.trim() });
  },

  removeUserByUserId: (userId) => {
    set((state) => {
      const { [userId]: removed, ...userMap } = state.userMap;
      return removed ? { userMap } : state;
    });
  },

  removeNewUsers: () => {
    const newUserIds = new Set(
      get()
        .getUsers()
        .filter((user) => user.isNew)
        .map((user) => user._id),
    );
    if (!newUserIds.size) return;
    set((state) => ({
      userMap: Object.fromEntries(Object.entries(state.userMap).filter(([userId]) => !newUserIds.has(userId))),
    }));
  },

  createUser: (permission) => {
    const user: IUser = {
      _id: getObjectId(),
      uid: '',
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      designation: '',
      gender: Gender.OTHER,
      permission,
      accountType: AccountType.INVITED,
      isUpdated: false,
      isNew: true,
    };
    get().addUsers([user]);
    return user;
  },

  loadLoggedInUsers: () =>
    get().run('loggedInUsers', async () => {
      const result = await UserService.getInitialLoginData();
      if (!result?.data) return;
      const { users, orgs } = result.data;
      get().addUsers(users);
      get().addOrgs(orgs);
      set({ loggedInUserIds: users.map((user) => user._id) });
      const org = localStorage.getItem(StorageKey.ORGANIZATION);
      const loggedInUsers = get().getLoggedInUsers();
      const user = (org ? loggedInUsers.find((item) => item.org === org) : loggedInUsers[0]) ?? loggedInUsers[0];
      // Selection is the selector store's business; this store only supplies the user.
      // `org` is optional on a client row (ClientEntity leaves ownership fields optional) but is
      // always present on a fetched one.
      if (user?.org && user.permission) {
        useSelectorStore.getState().selectUserAndOrg(user._id, user.org, user.permission as DefaultRole);
      }
    }),

  loadUsers: () =>
    get().run('users', async () => {
      const result = await UserService.getOrgUsers();
      if (result?.data) get().addUsers(result.data);
    }),

  loadStudentStandardMappings: () =>
    get().run('studentStandardMappings', async () => {
      const result = await MappingService.getOrgStudentStandardMappings();
      if (result?.data) get().addStudentStandardMaps(result.data);
    }),

  reset: () => {
    set({ userMap: {}, orgMap: {}, studentStandardMap: {}, loggedInUserIds: [] });
    get().resetRequests();
  },
}));

/**
 * The store's lookups, subscribed to the state they read.
 *
 * `getStudentStandardsByStudentId` resolves standards through the standard store, so this
 * subscribes to both — see decision 4 in the migration plan.
 */
export const useUserLookups = (): IUserState => {
  useStandardStore(useShallow((state) => state.standardMap));
  return useUserStore(useShallow((state) => state));
};

/** The selected user, or `undefined`. Replaces `selectorStore.selectedUser`. */
export const useSelectedUser = (): IUser | undefined => {
  const selectedUserId = useSelectorStore((state) => state.selectedUserId);
  return useUserStore((state) => (selectedUserId ? state.userMap[selectedUserId] : undefined));
};

/** The selected org, or `undefined`. Replaces `selectorStore.selectedOrg`. */
export const useSelectedOrg = (): IOrg | undefined => {
  const selectedOrgId = useSelectorStore((state) => state.selectedOrgId);
  return useUserStore((state) => (selectedOrgId ? state.orgMap[selectedOrgId] : undefined));
};

/** The selected student, or `undefined`. Replaces `selectorStore.selectedStudent`. */
export const useSelectedStudent = (): IUser | undefined => {
  const selectedStudentId = useSelectorStore((state) => state.selectedStudentId);
  return useUserStore((state) => (selectedStudentId ? state.userMap[selectedStudentId] : undefined));
};

/** The selected collaborator, or `undefined`. Replaces `selectorStore.selectedCollaborator`. */
export const useSelectedCollaborator = (): IUser | undefined => {
  const selectedCollaboratorId = useSelectorStore((state) => state.selectedCollaboratorId);
  return useUserStore((state) => (selectedCollaboratorId ? state.userMap[selectedCollaboratorId] : undefined));
};
