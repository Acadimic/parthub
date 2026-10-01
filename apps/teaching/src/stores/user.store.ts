import { type OrgDto, type StudentStandardMappingDto, type UserDto, type StandardDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice, isProfileForApp } from '@repo/shared/utils';
import { type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { AccountType, DefaultRole, Gender, StorageKey } from '../enums';
import { MappingService, UserService } from '../services';
import { capitalize } from '../utils/helpers';
import { getObjectId } from '../utils/helpers';
import { THIS_APP } from '../utils/constants';
import { useSelectorStore } from './selector.store';
import { useStandardStore } from './standard.store';

/**
 * A user in the store. `isNew` is client-only and stripped from every request by
 * `CLIENT_ONLY_KEYS`: it marks a draft the user is still creating.
 */
export type IUser = UserDto & { isNew?: boolean };

/**
 * Whether a user is a student. Decided by what their role grants, not by its name, so a custom
 * role behaves correctly -- the old check compared against a `DefaultRole` the server had
 * collapsed every custom role onto.
 */
export const isStudentUser = (user: IUser): boolean => user.permission === DefaultRole.STUDENT;

/** The fetches this store tracks. */
type UserFetch = 'loggedInUsers' | 'users' | 'studentStandardMappings';

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
  getStudentItems: () => ISelectItem[];
  getCollaboratorItems: () => ISelectItem[];
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

  /** Adds an unsaved user with the given permission and returns it, for the caller to select. */
  createUser: (permission: DefaultRole) => IUser;
  /** Adds an unsaved student and returns it, for the caller to select. */
  createStudent: () => IUser;
  /** Adds an unsaved collaborator with the given permission, for the caller to select. */
  createCollaborator: (permission: DefaultRole) => IUser;

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
  description: `${capitalize(user.permission)} (${user.email})`,
  group: `${user.permission}s`,
});

/**
 * The members of the selected org. The map also holds the signed-in person's own rows in their
 * other orgs, one per profile, and those are not this org's students or collaborators.
 */
const getSelectedOrgUsers = (users: IUser[]): IUser[] => {
  const org = useSelectorStore.getState().selectedOrgId;
  return users.filter((user) => user.org === org);
};

/**
 * The org the other app asked for with `?org=`, when it sent the user here from its profile menu.
 * Read once and removed from the address, so a reload or a shared link does not reapply it.
 */
const takeRequestedOrg = (): string | null => {
  const url = new URL(window.location.href);
  const org = url.searchParams.get('org');
  if (!org) return null;
  url.searchParams.delete('org');
  window.history.replaceState(window.history.state, '', url.toString());
  return org;
};

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

  getStudents: () => getSelectedOrgUsers(get().getUsers()).filter(isStudentUser),

  getCollaborators: () => getSelectedOrgUsers(get().getUsers()).filter((user) => !isStudentUser(user)),

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

  createStudent: () => get().createUser(DefaultRole.STUDENT),

  createCollaborator: (permission) => get().createUser(permission),

  loadLoggedInUsers: () =>
    get().run('loggedInUsers', async () => {
      const result = await UserService.getInitialLoginData();
      if (!result?.data) return;
      const { users, orgs } = result.data;
      get().addUsers(users);
      get().addOrgs(orgs);
      set({ loggedInUserIds: users.map((user) => user._id) });
      const org = localStorage.getItem(StorageKey.ORGANIZATION);
      // Only profiles that fit this app are selectable here; the rest open the other app.
      const loggedInUsers = get()
        .getLoggedInUsers()
        .filter((item) => isProfileForApp(THIS_APP, item.permission));
      const requested = takeRequestedOrg();
      const user =
        loggedInUsers.find((item) => item.org === requested) ??
        loggedInUsers.find((item) => item.org === org) ??
        loggedInUsers[0];
      // Selection is the selector store's business; this store only supplies the user.
      // `org` is optional on the DTO (a write body never sends the ownership fields) but is
      // always present on a fetched one.
      if (user?.org) {
        useSelectorStore.getState().selectUserAndOrg(user._id, user.org);
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
