import { InviteService } from '@modules/invite/invite.service';
import { OrgService } from '@modules/org/org.service';
import { RoleService } from '@modules/role/role.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AccountType, DEFAULT_PERMISSIONS, DefaultRole, OrgType, PermissionItem, Subdomain } from '@parthhub/shared';
import {
  CreateUserDto,
  FindByOrgIdAndUidDto,
  InitialDataDto,
  RegisterUserDto,
  RoleDto,
  UpdateOrgUserDto,
  UpdateProfileDto,
  UserDto,
} from '@parthhub/shared/validations';
import { getObjectId } from '@utils/util';
import { Model, Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { RoleDocument } from '@modules/role/role.schema';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly orgService: OrgService,
    private readonly roleService: RoleService,
    private readonly inviteService: InviteService,
    private readonly requestContextService: RequestContextService,
  ) {}

  transformUser(user: UserDocument): UserDto {
    return {
      ...user,
      _id: user._id.toString(),
      org: user.org?.toString(),
      role: user.role?.toString(),
      standards: user.standards?.map((standard) => standard.toString()),
      dob: user.dob ? new Date(user.dob).toISOString() : undefined,
    };
  }

  /** The role name the apps use as `permission`; falls back to the closest default role for custom roles. */
  getPermissionForRole(role: RoleDocument | undefined): DefaultRole {
    // The apps model `permission` as a strict DefaultRole enum, so a custom role must always be
    // mapped onto the closest default rather than returned verbatim or left undefined.
    if (role?.isAdmin) return DefaultRole.SUPER_ADMIN;
    if (role && (Object.values(DefaultRole) as string[]).includes(role.role)) return role.role as DefaultRole;
    if (role?.permissions?.includes(PermissionItem.STUDENT)) return DefaultRole.STUDENT;
    if (role?.permissions?.includes(PermissionItem.CREATE_COURSE)) return DefaultRole.TEACHER;
    return DefaultRole.ASSISTANT;
  }

  async withPermissions(users: UserDto[]): Promise<UserDto[]> {
    const roleIds = [...new Set(users.map((user) => user.role).filter(Boolean))];
    const roles = await this.roleService.getRolesByIds(roleIds);
    const roleMap = new Map(roles.map((role) => [role._id.toString(), role]));
    return users.map((user) => ({ ...user, permission: this.getPermissionForRole(roleMap.get(user.role)) }));
  }

  /**
   * First login of a Firebase account. Two paths:
   * - Invited: the user joins the inviting org with the invited role (learner joins a teacher's org).
   * - Self sign-up: a personal org is created with the default roles. Teachers (and admins) own it as
   *   SUPER_ADMIN; learners signing up from the learn app get the STUDENT role in their own org.
   */
  async registerUser(payload: RegisterUserDto, subdomain?: Subdomain): Promise<UserDto> {
    const invite = await this.inviteService.getPendingInviteByEmail(payload.email);
    const timezone = this.requestContextService.getTimezone() || 'Asia/Kolkata';

    if (invite) {
      const org = invite.org.toString();
      const dbUser = await this.requestContextService.withOrg(org, () =>
        this.upsert({
          ...payload,
          org,
          isUpdated: false,
          timezone,
          accountType: AccountType.INVITED,
          invitedBy: invite.invitedBy.toString(),
          role: invite.role.toString(),
          invite: invite._id.toString(),
        }),
      );
      await this.inviteService.acceptPendingInvite(invite._id.toString());
      return dbUser;
    }

    const rolePayloads: RoleDto[] = Object.values(DefaultRole).map((role) => ({
      _id: getObjectId(),
      role,
      permissions: DEFAULT_PERMISSIONS[role],
      org: payload.org,
      isAdmin: role === DefaultRole.SUPER_ADMIN,
    }));
    const ownerRole = subdomain === Subdomain.LEARN ? DefaultRole.STUDENT : DefaultRole.SUPER_ADMIN;
    const currentRole = rolePayloads.find((r) => r.role === ownerRole)!._id;

    // Roles and org first so a failure never leaves a user pointing at a half-created org.
    await this.roleService.upsertBulk(rolePayloads);
    await this.orgService.upsert({
      _id: payload.org,
      name: payload.name || payload.email.split('@')[0],
      orgType: OrgType.INDIVIDUAL,
    });
    return await this.upsert({
      ...payload,
      isUpdated: false,
      timezone,
      accountType: AccountType.SELF,
      role: currentRole,
    });
  }

  async upsert(payload: CreateUserDto): Promise<UserDto> {
    const name = payload.name || '';
    const { _id } = payload;
    const user = await this.userModel
      .findOneAndUpdate({ _id }, { ...payload, name }, { upsert: true, new: true, runValidators: true })
      .select(Object.values(new UserDto()).join(' '))
      .lean<UserDocument>()
      .exec();
    return this.transformUser(user);
  }

  async getUsersByUid(uid: string): Promise<UserDto[]> {
    if (!uid) throw new NotAcceptableException('UID is required!');
    const users = await this.userModel.find({ uid, _deleted: { $ne: true } }).lean<UserDocument[]>();
    return users.map((user) => this.transformUser(user));
  }

  async getUsersByEmail(email: string): Promise<UserDocument[]> {
    if (!email) throw new NotAcceptableException('Email is required!');
    return this.userModel.find({ email, _deleted: { $ne: true } }).lean<UserDocument[]>();
  }

  async getUserById(_id: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ _id, _deleted: { $ne: true } }).lean<UserDocument>();
  }

  async getUserByOrgIdAndUid(payload: FindByOrgIdAndUidDto): Promise<UserDocument | null> {
    const { org, uid } = payload;
    if (!org) throw new NotAcceptableException('Org ID is required!');
    if (!uid) throw new NotAcceptableException('UID is required!');
    return await this.userModel
      .findOne({ org: new Types.ObjectId(org), uid, _deleted: { $ne: true } })
      .lean<UserDocument>()
      .exec();
  }

  async updateLastActive(userId: string, lastActive: Date): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { lastActive },
        {
          new: true,
          runValidators: true,
          skipActivityLog: true,
        },
      )
      .lean<UserDocument>();
  }

  async getInitialLoginData(payload: UserDto): Promise<InitialDataDto> {
    const { uid } = payload;
    const users = await this.getUsersByUid(uid);
    if (!users.length) throw new NotAcceptableException('User not found!');
    const orgIds: string[] = [
      ...new Set(
        users
          .map((user) => user.org)
          .filter(Boolean)
          .map(String),
      ),
    ];
    const orgs = await this.orgService.getOrgsByIds(orgIds);
    if (orgIds.length !== orgs.length) throw new NotAcceptableException('Org not found!');
    return { users: await this.withPermissions(users), orgs };
  }

  /** A user completing or editing their own profile; marks onboarding as done. */
  async updateProfile(userId: string | Types.ObjectId, payload: UpdateProfileDto): Promise<UserDto> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { ...payload, isUpdated: true }, { new: true, runValidators: true })
      .lean<UserDocument>()
      .exec();
    if (!user) throw new NotFoundException('User not found.');
    const [withPermission] = await this.withPermissions([this.transformUser(user)]);
    return withPermission;
  }

  /** Staff editing another member of the same org (students, collaborators). */
  async updateOrgUser(payload: UpdateOrgUserDto): Promise<UserDto> {
    const { _id, ...fields } = payload;
    const org = this.requestContextService.getOrgId();
    const member = await this.userModel
      .findOne({ _id, org, _deleted: { $ne: true } })
      .lean<UserDocument>()
      .exec();
    if (!member) throw new ForbiddenException('User does not belong to your organization.');
    const user = await this.userModel
      .findByIdAndUpdate(_id, { ...fields }, { new: true, runValidators: true })
      .lean<UserDocument>()
      .exec();
    const [withPermission] = await this.withPermissions([this.transformUser(user!)]);
    return withPermission;
  }

  async getOrgUsers(org: string): Promise<UserDocument[]> {
    return this.userModel.find({ org, _deleted: { $ne: true } }).lean<UserDocument[]>();
  }

  async getOrgUsersByEmails(org: string, emails: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ org, email: { $in: emails }, _deleted: { $ne: true } }).lean<UserDocument[]>();
  }

  async getOrgStaff(): Promise<UserDto[]> {
    const org = this.requestContextService.getOrgId();
    const users = await this.userModel
      .find({ org, _deleted: { $ne: true } })
      .sort({ isInactive: 1, updatedAt: -1 })
      .lean<UserDocument[]>()
      .exec();
    return this.withPermissions(users.map((user) => this.transformUser(user)));
  }

  async revokeAccess(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { isInactive: true }).exec();
  }

  async restoreAccess(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { isInactive: false }).exec();
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { role: new Types.ObjectId(roleId) }).exec();
  }

  async acceptInviteAndJoinOrg(currentUser: UserDto, inviteId: string): Promise<UserDto> {
    const invite = await this.inviteService.getPendingInviteById(inviteId);
    if (!invite) {
      throw new NotFoundException('Pending invite not found.');
    }
    if (invite.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new BadRequestException('This invite was sent to a different email address.');
    }
    // Deliberately not filtering soft-deleted rows: this guards the unique { uid, org } index,
    // which counts them. Skipping them would let the insert fail with a duplicate-key error
    // instead of this readable message.
    const existingUser = await this.userModel
      .findOne({ uid: currentUser.uid, org: invite.org })
      .lean<UserDocument>()
      .exec();
    if (existingUser) {
      throw new BadRequestException('You are already a member of this organization.');
    }
    const org = invite.org.toString();
    const newUser = await this.requestContextService.withOrg(org, () =>
      this.upsert({
        _id: getObjectId(),
        uid: currentUser.uid,
        name: currentUser.name,
        email: currentUser.email,
        org,
        isUpdated: false,
        timezone: this.requestContextService.getTimezone() || 'Asia/Kolkata',
        accountType: AccountType.INVITED,
        invitedBy: invite.invitedBy.toString(),
        role: invite.role.toString(),
        invite: invite._id.toString(),
      }),
    );
    await this.inviteService.acceptPendingInvite(invite._id.toString());
    return newUser;
  }

  async declineInvite(currentUser: UserDto, inviteId: string): Promise<void> {
    const invite = await this.inviteService.getPendingInviteById(inviteId);
    if (!invite) {
      throw new NotFoundException('Pending invite not found.');
    }
    if (invite.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new BadRequestException('This invite was sent to a different email address.');
    }
    await this.inviteService.declineInvite(inviteId);
  }
}
