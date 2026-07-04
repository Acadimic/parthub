import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '../role/role.schema';
import { PermissionService } from './permission.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
