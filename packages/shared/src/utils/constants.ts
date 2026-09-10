import { PermissionItem } from '../enums/permission.enum';
import { DefaultRole } from '../enums/role.enum';
import { Subdomain } from '../enums/subdomain.enum';

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
    // Learner-owned features: a student manages only their own bookmarks, reactions and follows.
    PermissionItem.MANAGE_BOOKMARK,
    PermissionItem.MANAGE_REACTION,
    PermissionItem.MANAGE_FOLLOWER,
    PermissionItem.STUDENT,
  ],
};
