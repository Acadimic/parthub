export enum CourseItemType {
  COURSE_INFO = 'course info',
  COURSE_MATERIALS = 'course materials',
  SESSIONS = 'sessions',
  DOUBTS = 'doubts',
  MESSAGES = 'messages',
  NOTES = 'notes',
}

export enum ModuleContentType {
  READING = 'reading',
  VIDEO = 'video',
  TEST_PAPER = 'test paper',
  COMPLETED = 'completed',
}

/** The lists the course outline can show. */
export enum CourseOutlineTab {
  CONTENTS = 'contents',
  TESTS = 'tests',
  LIVE_CLASSES = 'liveClasses',
  DISCUSSION = 'discussion',
  DOUBTS = 'doubts',
}

/** How a lesson is read: one topic at a time with its own pager, or the whole body at once. */
export enum LessonViewMode {
  READER = 'reader',
  FULL = 'full',
}
