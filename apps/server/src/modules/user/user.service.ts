import { InviteService } from '@modules/invite/invite.service';
import { OrgService } from '@modules/org/org.service';
import { RoleService } from '@modules/role/role.service';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DEFAULT_PERMISSIONS, DefaultRole, AccountType } from '@parthhub/shared';
import {
  CreateUserDto,
  FindByOrgIdAndUidDto,
  InitialDataDto,
  RegisterUserDto,
  RoleDto,
  UserDto,
} from '@parthhub/shared/dist/dtos/validations';
import { getObjectId } from '@utils/util';
import { Model, Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly orgService: OrgService,
    private readonly roleService: RoleService,
    private readonly inviteService: InviteService,
    private readonly requestContextService: RequestContextService,
  ) {}

  transformUser(user: UserDocument): UserDto {
    return {
      ...user,
      _id: user._id.toString(),
      orgId: user.orgId.toString(),
      role: user.role.toString(),
    };
  }

  async registerUser(payload: RegisterUserDto): Promise<UserDto> {
    console.log('##Registering user: ', payload);
    const invite = await this.inviteService.getPendingInviteByEmail(payload.email);
    const rolePayloads: RoleDto[] = Object.values(DefaultRole).map((role) => ({
      _id: getObjectId(),
      role,
      permissions: DEFAULT_PERMISSIONS[role],
      orgId: payload.orgId,
      isAdmin: role === DefaultRole.SUPER_ADMIN,
    }));
    if (!invite) await this.roleService.upsertBulk(rolePayloads);
    const currentRole = invite
      ? invite.role.toString()
      : rolePayloads.find((r) => (r.role as DefaultRole) === DefaultRole.SUPER_ADMIN)?._id;
    const dbUser = await this.upsert({
      ...payload,
      orgId: invite ? invite.orgId.toString() : payload.orgId,
      isUpdated: false,
      timezone: this.requestContextService.getTimezone() || 'Asia/Kolkata',
      accountType: invite ? AccountType.INVITED : AccountType.SELF,
      invitedBy: invite ? invite.invitedBy.toString() : undefined,
      role: currentRole!,
      invite: invite ? invite._id.toString() : undefined,
    });
    console.log('##Registered user: ', dbUser);
    if (!invite) await this.orgService.upsert({ _id: payload.orgId, name: payload.name || '' });
    console.log('##Created org: ', payload.orgId);
    if (invite) await this.inviteService.acceptPendingInvite(invite._id.toString());
    return dbUser;
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
    const users = await this.userModel.find({ uid }).lean<UserDocument[]>();
    return users.map((user) => this.transformUser(user));
  }

  async getUsersByEmail(email: string): Promise<UserDocument[]> {
    if (!email) throw new NotAcceptableException('Email is required!');
    return this.userModel.find({ email }).lean<UserDocument[]>();
  }

  async getUserById(_id: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ _id }).lean<UserDocument>();
  }

  async getUserByOrgIdAndUid(payload: FindByOrgIdAndUidDto): Promise<UserDocument | null> {
    const { orgId, uid } = payload;
    console.log('##Org ID: ', orgId, uid);
    if (!orgId) throw new NotAcceptableException('Org ID is required!');
    if (!uid) throw new NotAcceptableException('UID is required!');
    return await this.userModel.findOne({ orgId: new Types.ObjectId(orgId), uid }).lean<UserDocument>().exec();
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
    const orgIds: string[] = users.map((user) => user.orgId).map((orgId) => String(orgId));
    const orgs = await this.orgService.getOrgsByIds(orgIds);
    console.log('##Orgs: ', orgs);
    console.log('##Org IDs: ', orgIds);
    if (orgIds.length !== orgs.length) throw new NotAcceptableException('Org not found!');
    return { users, orgs };
  }

  async getOrgUsers(orgId: string): Promise<UserDocument[]> {
    return this.userModel.find({ orgId }).lean<UserDocument[]>();
  }

  async getOrgUsersByEmails(orgId: string, emails: string[]): Promise<UserDocument[]> {
    return this.userModel.find({ orgId, email: { $in: emails } }).lean<UserDocument[]>();
  }

  async getOrgStaff(): Promise<UserDto[]> {
    const orgId = this.requestContextService.getOrgId();
    const users = await this.userModel
      .find({ orgId })
      .sort({ isInactive: 1, updatedAt: -1 })
      .lean<UserDocument[]>()
      .exec();
    return users.map((user) => this.transformUser(user));
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
    const existingUser = await this.userModel
      .findOne({ uid: currentUser.uid, orgId: invite.orgId })
      .lean<UserDocument>()
      .exec();
    if (existingUser) {
      throw new BadRequestException('You are already a member of this organization.');
    }
    const newUser = await this.upsert({
      _id: getObjectId(),
      uid: currentUser.uid,
      name: currentUser.name,
      email: currentUser.email,
      orgId: invite.orgId.toString(),
      isUpdated: false,
      timezone: this.requestContextService.getTimezone() || 'Asia/Kolkata',
      accountType: AccountType.INVITED,
      invitedBy: invite.invitedBy.toString(),
      role: invite.role.toString(),
      invite: invite._id.toString(),
    });
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
