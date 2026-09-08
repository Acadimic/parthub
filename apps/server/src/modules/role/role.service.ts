import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteRoleDto, RoleDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { Role, RoleDocument } from './role.schema';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    private readonly requestContextService: RequestContextService,
  ) {}

  getTransformedRole(role: RoleDocument): RoleDto {
    return {
      ...role,
      _id: role._id.toString(),
    };
  }

  async upsert(payload: RoleDto): Promise<RoleDto> {
    const org = this.requestContextService.getOrgId();
    const existing = await this.roleModel.findOne({ _id: payload._id, org }).lean<RoleDocument>().exec();
    if (existing?.isAdmin) {
      throw new ForbiddenException('Cannot modify admin role.');
    }
    const role: RoleDocument = await this.roleModel
      // org in the filter so an upsert cannot reach another organization's role
      .findOneAndUpdate({ _id: payload._id, org }, { ...payload }, { returnDocument: 'after', upsert: true })
      .lean<RoleDocument>()
      .exec();
    return this.getTransformedRole(role);
  }

  async upsertBulk(payloads: RoleDto[]): Promise<RoleDto[]> {
    const bulkOps = payloads.map((payload) => this.upsert(payload));
    const result = await Promise.all(bulkOps);
    return result;
  }

  async getRoles(): Promise<RoleDto[]> {
    const org = this.requestContextService.getOrgId();
    const result = await this.roleModel
      .find({ org, _deleted: { $ne: true } })
      .sort({ isAdmin: -1, updatedAt: -1 })
      .lean<RoleDocument[]>()
      .exec();
    return result.map((role) => this.getTransformedRole(role));
  }

  /**
   * Deliberately a hard delete: the unique `{ role, org }` index counts soft-deleted rows, so
   * leaving the document would block ever re-creating a role with the same name.
   */
  async deleteRole(payload: DeleteRoleDto): Promise<void> {
    const { _id, reassignRoleId } = payload;
    const org = this.requestContextService.getOrgId();
    const role = await this.roleModel.findOne({ _id, org }).lean<RoleDocument>().exec();
    if (!role) throw new NotFoundException('Role not found.');
    if (role.isAdmin) throw new ForbiddenException('Cannot delete admin role.');

    if (reassignRoleId) {
      const reassignRole = await this.roleModel.findOne({ _id: reassignRoleId, org }).lean<RoleDocument>().exec();
      if (!reassignRole) throw new NotFoundException('Reassign role not found.');
    }

    await this.roleModel.deleteOne({ _id, org, isAdmin: { $ne: true } }).exec();
  }

  async findByName(org: string | Types.ObjectId, role: string): Promise<RoleDocument | null> {
    return this.roleModel
      .findOne({ org, role: role.trim().toLowerCase(), _deleted: { $ne: true } })
      .lean<RoleDocument>()
      .exec();
  }

  /**
   * Reads roles by id across organizations, on purpose: a user can belong to more than one org,
   * and the initial-login-data response resolves permissions for all of them at once. The ids
   * always come from user rows the caller is already entitled to.
   */
  async getRolesByIds(ids: (string | Types.ObjectId)[]): Promise<RoleDocument[]> {
    return this.roleModel
      .find({ _id: { $in: ids }, _deleted: { $ne: true } })
      .lean<RoleDocument[]>()
      .exec();
  }

  async findAdminByOrg(org: string | Types.ObjectId): Promise<RoleDocument | null> {
    return this.roleModel
      .findOne({ org, isAdmin: true, _deleted: { $ne: true } })
      .lean<RoleDocument>()
      .exec();
  }
}
