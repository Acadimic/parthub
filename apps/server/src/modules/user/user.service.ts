import { InviteService } from '@modules/invite/invite.service';
import { OrgService } from '@modules/org/org.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AccountType, DefaultRole, OrgType, Subdomain } from '@repo/shared/enums';
import {
  CreateUserDto,
  FindByOrgIdAndUidDto,
  InitialDataDto,
  RegisterUserDto,
  UpdateOrgUserDto,
  UpdateProfileDto,
  UserDto,
} from '@repo/shared/validations';
import { isProfileForApp } from '@repo/shared/utils';
import { getObjectId } from '@utils/util';
import { Model, Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly orgService: OrgService,
    private readonly inviteService: InviteService,
    private readonly requestContextService: RequestContextService,
  ) {}

  transformUser(user: UserDocument): UserDto {
    return {
      ...user,
      _id: user._id.toString(),
      org: user.org.toString(),
      standards: user.standards?.map((standard) => standard.toString()),
      dob: user.dob ? new Date(user.dob).toISOString() : undefined,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
    };
  }

  /**
   * The first login of a Firebase account in an app it has no fitting profile in. Two paths:
   * - Invited, when the invite's role fits the app: the user joins the inviting org with the
   *   permission the invite named.
   * - Self sign-up: a personal org is created and the user owns it with `payload.permission`,
   *   which `getRegisterPayload` derived from the app. It is used verbatim rather than re-derived
   *   here: the same value is already on the request context, and a second ternary disagreed with
   *   the first one for the support app.
   *
   * No roles are created: `permission` is stored on the user and the permission set comes from
   * `DEFAULT_PERMISSIONS`.
   */
  async registerUser(payload: RegisterUserDto, subdomain: Subdomain): Promise<UserDto> {
    const invite = await this.inviteService.getPendingInviteByEmail(payload.email);
    const timezone = this.requestContextService.getTimezone() || 'Asia/Kolkata';

    // An invite to a role this app cannot act as stays pending for the app it belongs to.
    if (invite && isProfileForApp(subdomain, invite.permission)) {
      const org = invite.org.toString();
      const dbUser = await this.requestContextService.withOrg(org, () =>
        this.upsert({
          ...payload,
          org,
          isUpdated: false,
          timezone,
          accountType: AccountType.INVITED,
          invitedBy: invite.invitedBy.toString(),
          permission: invite.permission,
          invite: invite._id.toString(),
        }),
      );
      await this.inviteService.acceptPendingInvite(invite._id.toString());
      return dbUser;
    }

    payload.name = payload.name || payload.email.split('@')[0] || '';
    // The org first, so a failure never leaves a user pointing at an org that was never created.
    await this.orgService.upsert({
      _id: payload.org,
      name: payload.name,
      orgType: subdomain === Subdomain.LEARN ? OrgType.STUDENT : OrgType.INDIVIDUAL,
    });
    return await this.upsert({
      ...payload,
      isUpdated: false,
      timezone,
      accountType: AccountType.SELF,
    });
  }

  async upsert(payload: CreateUserDto): Promise<UserDto> {
    const name = payload.name || '';
    const { _id } = payload;
    const user = await this.userModel
      .findOneAndUpdate({ _id }, { ...payload, name }, { upsert: true, returnDocument: 'after', runValidators: true })
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
          returnDocument: 'after',
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
    return { users, orgs };
  }

  /** A user completing or editing their own profile; marks onboarding as done. */
  async updateProfile(userId: string, payload: UpdateProfileDto): Promise<UserDto> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { ...payload, isUpdated: true }, { returnDocument: 'after', runValidators: true })
      .lean<UserDocument>()
      .exec();
    if (!user) throw new NotFoundException('User not found.');
    return this.transformUser(user);
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
      .findByIdAndUpdate(_id, { ...fields }, { returnDocument: 'after', runValidators: true })
      .lean<UserDocument>()
      .exec();
    if (!user) throw new NotFoundException('User not found.');
    return this.transformUser(user);
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
    return users.map((user) => this.transformUser(user));
  }

  // The user id comes from the request body, so every one of these is scoped to the caller's
  // organization: staff must not be able to reach a member of another org by guessing an id.
  async revokeAccess(userId: string): Promise<void> {
    const org = this.requestContextService.getOrgId();
    await this.userModel.updateOne({ _id: userId, org }, { isInactive: true }).exec();
  }

  async restoreAccess(userId: string): Promise<void> {
    const org = this.requestContextService.getOrgId();
    await this.userModel.updateOne({ _id: userId, org }, { isInactive: false }).exec();
  }

  async updateUserPermission(userId: string, permission: DefaultRole): Promise<void> {
    const org = this.requestContextService.getOrgId();
    await this.userModel.updateOne({ _id: userId, org }, { permission }).exec();
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
        permission: invite.permission,
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
