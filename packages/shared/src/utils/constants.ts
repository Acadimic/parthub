import { PermissionItem } from '../enums/permission.enum';
import { DefaultRole } from '../enums/role.enum';

const ALL_PERMISSIONS: PermissionItem[] = [
  PermissionItem.EDIT_ORG,

  PermissionItem.EDIT_ROLE,
  PermissionItem.VIEW_ROLE,
  PermissionItem.DELETE_ROLE,

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

export const DEFAULT_PERMISSIONS: Record<DefaultRole, PermissionItem[]> = {
  [DefaultRole.SUPER_ADMIN]: ALL_PERMISSIONS,

  [DefaultRole.TEACHER]: [
    PermissionItem.VIEW_ROLE,

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
    PermissionItem.VIEW_ROLE,

    PermissionItem.VIEW_COURSE,

    PermissionItem.VIEW_MATERIAL,

    PermissionItem.VIEW_TEST_PAPER,

    PermissionItem.VIEW_QUESTION,
  ],
};
