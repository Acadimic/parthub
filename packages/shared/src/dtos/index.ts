export * from './base-delete.dto';
export * from './base-owner.dto';
export * from './base-org.dto';

// Validation DTOs use class-validator/class-transformer decorators which require
// reflect-metadata. They are NOT re-exported here to keep the main barrel safe
// for client-side (browser) imports. Server code should import directly:
//   import { RegisterUserDto } from '@parthhub/shared/dist/dtos/validations/user/register.dto';
// Or use the dedicated validations barrel:
//   import { RegisterUserDto } from '@parthhub/shared/dist/dtos/validations';
