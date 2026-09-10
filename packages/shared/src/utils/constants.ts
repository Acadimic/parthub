import { PermissionItem } from '../enums/permission.enum';
import { DefaultRole } from '../enums/role.enum';
import { Subdomain } from '../enums/subdomain.enum';

const ALL_PERMISSIONS: PermissionItem[] = [
  PermissionItem.EDIT_ORG,

  PermissionItem.MANAGE_STAFF,
  PermissionItem.VIEW_STAFF,

  PermissionItem.CREATE_COURSE,
  PermissionItem.EDIT_COURSE,
  PermissionItem.DELETE_COURSE,
  PermissionItem.VIEW_COURSE,

  PermissionItem.MANAGE_SUBJECT,

  PermissionItem.MANAGE_MATERIAL,
  PermissionItem.VIEW_MATERIAL,

  PermissionItem.MANAGE_TEST_PAPER,
  PermissionItem.VIEW_TEST_PAPER,

  PermissionItem.MANAGE_CHAPTER,

  PermissionItem.MANAGE_QUESTION,
  PermissionItem.VIEW_QUESTION,
];

export const DEFAULT_PERMISSION_BY_APP: Record<Subdomain, DefaultRole> = {
  [Subdomain.TEACH]: DefaultRole.ADMIN,
  [Subdomain.LEARN]: DefaultRole.STUDENT,
  [Subdomain.SUPPORT]: DefaultRole.ADMIN,
};

export const DEFAULT_PERMISSIONS: Record<DefaultRole, PermissionItem[]> = {
  [DefaultRole.ADMIN]: ALL_PERMISSIONS,

  [DefaultRole.TEACHER]: [
    PermissionItem.VIEW_STAFF,

    PermissionItem.CREATE_COURSE,
    PermissionItem.EDIT_COURSE,
    PermissionItem.VIEW_COURSE,

    PermissionItem.MANAGE_SUBJECT,

    PermissionItem.MANAGE_MATERIAL,
    PermissionItem.VIEW_MATERIAL,

    PermissionItem.MANAGE_TEST_PAPER,
    PermissionItem.VIEW_TEST_PAPER,

    PermissionItem.MANAGE_CHAPTER,

    PermissionItem.MANAGE_QUESTION,
    PermissionItem.VIEW_QUESTION,
  ],

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

  [DefaultRole.ASSISTANT]: [
    PermissionItem.VIEW_COURSE,

    PermissionItem.VIEW_MATERIAL,

    PermissionItem.VIEW_TEST_PAPER,

    PermissionItem.VIEW_QUESTION,
  ],
};
