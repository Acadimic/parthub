import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PermissionItem } from '@repo/shared';
import { Model } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { Role, RoleDocument } from '../role/role.schema';

@Injectable()
export class PermissionService {
  constructor(
    private readonly requestContextService: RequestContextService,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async requireAny(permissions: PermissionItem[]): Promise<void> {
    const hasAccess = await this.hasAnyPermission(permissions);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
  }

  async hasPermission(permission: PermissionItem): Promise<boolean> {
    return this.hasAnyPermission([permission]);
  }

  async hasAnyPermission(permissions: PermissionItem[]): Promise<boolean> {
    const roleId = this.requestContextService.getRole();
    const role = await this.roleModel.findById(roleId).lean<RoleDocument>().exec();
    if (!role) return false;
    return permissions.some((p) => role.permissions.includes(p));
  }
}
