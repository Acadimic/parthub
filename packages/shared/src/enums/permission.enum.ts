export enum SpecialPermissions {
  SANDBOX = 'sandbox',
  SSO = 'sso',
}

export enum PermissionItem {
  // Organization
  EDIT_ORG = 'editOrg',

  // Role
  EDIT_ROLE = 'editRole',
  VIEW_ROLE = 'viewRole',
  DELETE_ROLE = 'deleteRole',

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

  // Student
  STUDENT = 'student',
}

// Backward compatibility alias
export { PermissionItem as Permission };
