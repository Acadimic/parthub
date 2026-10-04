export enum Layout {
  SIDEBAR = 'sidebar',
  EXAM = 'exam',
  AUTH = 'auth',
  ERROR = 'error',
  PAGE = 'page',
  PAGE_NAVIGATION = 'page-navigation',
  PUBLIC = 'public',
  /** No app header or tab bar: the learning view's own top bar is the only chrome. */
  FOCUS = 'focus',
  /** A printout: no chrome at all, but signed-in like any other screen. */
  PRINT = 'print',
  NONE = 'none',
}
