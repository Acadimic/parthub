import { Permission } from '@repo/shared';

export const ORIGIN = [/\.parthhub\.com$/, 'http://localhost:3000'];

export const INITIAL_LOGIN_DATA_URL = 'initial-login-data';
export const REGISTER_URL = 'register';

export const COLLABORATOR_PERMISSIONS = Object.values(Permission).filter((p) => p !== Permission.STUDENT);
export const STUDENT_PERMISSIONS = [Permission.STUDENT];
