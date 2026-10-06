export enum SpecialPermissions {
  SANDBOX = 'sandbox',
  SSO = 'sso',
}

export enum PermissionItem {
  // Organization
  EDIT_ORG = 'editOrg',

  // Staff
  MANAGE_STAFF = 'manageStaff',
  VIEW_STAFF = 'viewStaff',

  // Course
  CREATE_COURSE = 'createCourse',
  EDIT_COURSE = 'editCourse',
  DELETE_COURSE = 'deleteCourse',
  VIEW_COURSE = 'viewCourse',

  // Subject
  MANAGE_SUBJECT = 'manageSubject',

  // Material
  MANAGE_MATERIAL = 'manageMaterial',
  VIEW_MATERIAL = 'viewMaterial',

  // Test Paper
  MANAGE_TEST_PAPER = 'manageTestPaper',
  VIEW_TEST_PAPER = 'viewTestPaper',

  // Chapter
  MANAGE_CHAPTER = 'manageChapter',

  // Question
  MANAGE_QUESTION = 'manageQuestion',
  VIEW_QUESTION = 'viewQuestion',

  // Standard
  MANAGE_STANDARD = 'manageStandard',

  // Plan
  MANAGE_PLAN = 'managePlan',
  VIEW_PLAN = 'viewPlan',

  // Meet
  MANAGE_MEET = 'manageMeet',
  VIEW_MEET = 'viewMeet',

  // Batch
  MANAGE_BATCH = 'manageBatch',
  VIEW_BATCH = 'viewBatch',

  // Mapping
  MANAGE_MAPPING = 'manageMapping',

  // Bookmark
  MANAGE_BOOKMARK = 'manageBookmark',

  // Reaction
  MANAGE_REACTION = 'manageReaction',

  // Follower
  MANAGE_FOLLOWER = 'manageFollower',

  // Course discussion: comments and reviews
  MANAGE_DISCUSSION = 'manageDiscussion',

  // Student
  STUDENT = 'student',
}

// Backward compatibility alias
export { PermissionItem as Permission };
