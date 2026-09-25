import { type OrgDto, type StudentStandardMappingDto, type UserDto, type StandardDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { AccountType, DefaultRole, Gender, StorageKey } from '../enums';
import { FollowerService, MappingService, UserService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useSelectorStore } from './selector.store';
import { useStandardStore } from './standard.store';

/**
 * A user in the store. Every field here is client-only and stripped from every request by
 * `CLIENT_ONLY_KEYS`: `isNew` marks a draft the user is still creating, and the API sends
 * `avatar` rather than `photoUrl`.
 */
export type IUser = UserDto & {
  isNew?: boolean;
  photoUrl?: string | null;
  followersCount?: number;
  isLoadedFollowersCount?: boolean;
  isLoadingFollowersCount?: boolean;
  isLoadedCompletedModules?: boolean;
};

/** Whether a user is a student. Was the `isStudent` view on the MST model. */
export const isStudentUser = (user: IUser): boolean => user.permission === DefaultRole.STUDENT;

/** The fetches this store tracks. */
type UserFetch = 'loggedInUsers' | 'studentStandardMappings';

export interface IUserState extends IRequestSlice<UserFetch> {
  userMap: Record<string, IUser>;
  orgMap: Record<string, OrgDto>;
  studentStandardMap: Record<string, StudentStandardMappingDto>;
  loggedInUserIds: string[];

  getUserById: (userId: string) => IUser | undefined;
  getOrgById: (orgId: string) => OrgDto | undefined;
  getUsers: () => IUser[];
  getUsersByIds: (userIds: string[]) => IUser[];
  getLoggedInUsers: () => IUser[];
  getStudents: () => IUser[];
  getCollaborators: () => IUser[];
  getStudentStandardMappings: () => StudentStandardMappingDto[];
  getStudentStandardMappingsByStudentId: (studentId: string) => StudentStandardMappingDto[];
  getStudentStandardsByStudentId: (studentId: string) => StandardDto[];
  getStudentEnrolledDateByStudentId: (studentId: string) => string;

  addUsers: (users: IUser[]) => void;
  addOrgs: (orgs: OrgDto[]) => void;
  addStudentStandardMaps: (mappings: StudentStandardMappingDto[]) => void;
  patchUser: (userId: string, fields: Partial<IUser>) => void;
  /** Sets a name part and keeps the joined `name` in step — the model's setters did both. */
  setUserName: (userId: string, parts: { firstName?: string; lastName?: string }) => void;
  removeUserByUserId: (userId: string) => void;
  removeNewUsers: () => void;

  /** Adds an unsaved user with the given permission and returns it. */
  getNewUser: (permission: DefaultRole) => IUser;
  createStudent: () => IUser;
  createCollaborator: (permission: DefaultRole) => IUser;

  /** Fetches a user's follower count into their row. Was `loadFollowersCount` on the model. */
  loadFollowersCount: (userId: string) => Promise<void>;
  loadLoggedInUsers: () => Promise<void>;
  loadStudentStandardMappings: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useUserStore = create<IUserState>()((set, get) => ({
  userMap: {},
  orgMap: {},
  studentStandardMap: {},
  loggedInUserIds: [],
  ...createRequestSlice(['loggedInUsers', 'studentStandardMappings'], set, get),

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

  getStudentStandardMappings: () => Object.values(get().studentStandardMap),

  getStudentStandardMappingsByStudentId: (studentId) =>
    get()
      .getStudentStandardMappings()
      .filter((mapping) => mapping.student === studentId),

  getStudentStandardsByStudentId: (studentId) =>
    useStandardStore.getState().getStandardsByIds(
      get()
        .getStudentStandardMappingsByStudentId(studentId)
        .map((mapping) => mapping.standard),
    ),

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

  getNewUser: (permission) => {
    const user: IUser = {
      _id: getObjectId(),
      // A draft belongs to the org being viewed. The server assigns `org` itself on the write, but
      // the field is required on `UserDto`, and the row sits in the same store as fetched users.
      org: useSelectorStore.getState().selectedOrgId,
      uid: '',
      name: '',
      firstName: '',
      lastName: '',
      email: '',
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

  createStudent: () => get().getNewUser(DefaultRole.STUDENT),

  createCollaborator: (permission) => get().getNewUser(permission),

  // Settles the row whether or not the request succeeds: an unhandled rejection here escaped to
  // the page, and the skeleton it left behind never stopped spinning.
  loadFollowersCount: async (userId) => {
    if (!userId) return;
    get().patchUser(userId, { isLoadingFollowersCount: true });
    let followersCount = 0;
    try {
      const result = await FollowerService.getFollowersCount(userId);
      followersCount = result?.data ?? 0;
    } catch {
      followersCount = 0;
    }
    get().patchUser(userId, {
      followersCount,
      isLoadedFollowersCount: true,
      isLoadingFollowersCount: false,
    });
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
      // `org` is optional on a client row but always present on a fetched one. Selection is the
      // selector store's business; this store only supplies the user.
      if (user?.org) {
        useSelectorStore.getState().selectUserAndOrg(user._id, user.org);
      }
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
export const useSelectedOrg = (): OrgDto | undefined => {
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
