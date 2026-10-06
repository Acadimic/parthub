import { AccountSettingsType } from '../enums/app.enum';
import { PermissionItem } from '../enums/permission.enum';
import { DefaultRole } from '../enums/role.enum';
import { StandardGroup } from '../enums/standard.enum';
import { Subdomain } from '../enums/subdomain.enum';
import { type IDynamicObject } from '../interfaces/common.interface';

/**
 * Every permission the system defines.
 *
 * Derived from the enum rather than hand-listed. The list that was here was maintained by hand and
 * had fallen seven items behind it — `manageStandard`, `managePlan`, `viewPlan`, `manageMeet`,
 * `manageBatch`, `viewBatch` and `manageMapping` were defined but granted to nobody, so 20 routes
 * across meet, plan, batch, mappings and standard were unreachable by every role including admin.
 * Deriving it means a new `PermissionItem` cannot be silently ungranted again.
 */
const ALL_PERMISSIONS: PermissionItem[] = Object.values(PermissionItem);

export const DEFAULT_PERMISSION_BY_APP: Record<Subdomain, DefaultRole> = {
  [Subdomain.TEACH]: DefaultRole.ADMIN,
  [Subdomain.LEARN]: DefaultRole.STUDENT,
  [Subdomain.SUPPORT]: DefaultRole.ADMIN,
};

const PROFILE_FITS_APP: Record<Subdomain, (permission: DefaultRole) => boolean> = {
  [Subdomain.LEARN]: (permission) => permission === DefaultRole.STUDENT,
  [Subdomain.TEACH]: (permission) => permission !== DefaultRole.STUDENT,
  [Subdomain.SUPPORT]: () => true,
};

/**
 * Whether a membership with this permission belongs in this app: student rows in learning, staff
 * rows in teaching. The server refuses a row that does not fit, and each app offers such a row as
 * a link to the other app instead of switching to it.
 */
export const isProfileForApp = (app: Subdomain, permission: DefaultRole): boolean => PROFILE_FITS_APP[app](permission);

export const DEFAULT_PERMISSIONS: Record<DefaultRole, PermissionItem[]> = {
  // Provisional: admin, teacher and assistant all hold every permission until the per-role split
  // is decided. The apps stay separated by @Subdomains regardless of this map — the learn-only
  // routes (bookmark, reaction, follower, meet/my, meet/by-ids) cannot be reached from the
  // teaching app, and the teach-only ones cannot be reached from learning.
  [DefaultRole.ADMIN]: ALL_PERMISSIONS,
  [DefaultRole.TEACHER]: ALL_PERMISSIONS,
  [DefaultRole.ASSISTANT]: ALL_PERMISSIONS,

  [DefaultRole.STUDENT]: [
    PermissionItem.VIEW_COURSE,
    PermissionItem.VIEW_MATERIAL,
    PermissionItem.VIEW_TEST_PAPER,
    PermissionItem.VIEW_QUESTION,
    PermissionItem.VIEW_MEET,
    // Learner-owned features: a student manages only their own bookmarks, reactions, follows,
    // comments and reviews.
    PermissionItem.MANAGE_BOOKMARK,
    PermissionItem.MANAGE_REACTION,
    PermissionItem.MANAGE_FOLLOWER,
    PermissionItem.MANAGE_DISCUSSION,
    PermissionItem.STUDENT,
  ],
};

/** Column key of a table's row-actions column. */
export const ACTIONS = 'actions';

/** The "everything" option of a filter select. */
export const ALL = 'ALL';

/** Display order of the standard groups; a group missing here sorts last. */
export const STANDARD_GROUP_ORDER: IDynamicObject = {
  [StandardGroup.CLASSES]: 100,
  [StandardGroup.COMPETITIVE_EXAMS]: 500,
  [StandardGroup.POST_GRADUATE_COMPETITIVE_EXAMS]: 1000,
  [StandardGroup.GATE]: 1500,
  [StandardGroup.GENERAL]: 1200,
  [StandardGroup.OLYMPIADS]: 1300,
  [StandardGroup.UNDERGRADUATE]: 1400,
  [StandardGroup.POST_GRADUATE]: 1600,
  [StandardGroup.LEARNING_TRACKS]: 1700,
  [StandardGroup.LANGUAGES]: 1800,
};

export const AccountSettingsRoutes: Record<AccountSettingsType, string> = {
  [AccountSettingsType.ACCOUNT_SETTINGS]: '/account-settings',
  [AccountSettingsType.PROFILE]: '/account-settings/profile',
  [AccountSettingsType.SECURITY]: '/account-settings/security',
};

/** `Date.getDay()` index to weekday name. */
export const WEEK_DAYS_INTEGER_MAPPINGS: Record<string, string> = {
  '0': 'Sunday',
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday',
};
