import { UserDocument } from '@modules/user/user.schema';
import { UserService } from '@modules/user/user.service';
import { RoleService } from '@modules/role/role.service';
import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InviteStatus } from '@repo/shared';
import { InviteLookupDto, InviteDto, InviteUserDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { RequestContextService } from '../../context/request-context.service';
import { Invite, InviteDocument } from './invite.schema';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(Invite.name) private readonly inviteModel: Model<InviteDocument>,
    private readonly requestContextService: RequestContextService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  /** Invites may name the role (e.g. "student") instead of passing a Role id; resolve it within the org. */
  private async resolveRoleId(role: string, org: Types.ObjectId): Promise<string> {
    if (Types.ObjectId.isValid(role)) return role;
    const roleDoc = await this.roleService.findByName(org, role);
    if (!roleDoc) throw new BadRequestException(`Role "${role}" does not exist in this organization.`);
    return roleDoc._id.toString();
  }

  getTransformedInvite(invite: InviteDocument): InviteDto {
    return {
      ...invite,
      _id: invite._id.toString(),
      role: invite.role.toString(),
      invitedBy: invite.invitedBy.toString(),
      acceptedDate: invite.acceptedDate?.toISOString(),
    };
  }

  async upsert(payload: InviteUserDto): Promise<InviteDto> {
    const { email } = payload;
    const org = this.requestContextService.getOrgId();
    const role = await this.resolveRoleId(payload.role, org);
    // `_id` is client-generated and immutable, so it must not reach the update; matching on
    // (email, org) alone — the unique index — lets a declined or revoked invite be re-sent.
    const { _id, ...fields } = payload;
    const invite: InviteDocument = await this.inviteModel
      .findOneAndUpdate(
        { email, org },
        {
          ...fields,
          role,
          invitedBy: this.requestContextService.getUserId(),
          status: InviteStatus.PENDING,
          acceptedDate: null,
          $setOnInsert: { _id },
        },
        { new: true, upsert: true },
      )
      .select(Object.keys(new InviteDto()).join(' '))
      .lean<InviteDocument>()
      .exec();
    return this.getTransformedInvite(invite);
  }

  async upsertBulk(payloads: InviteUserDto[]): Promise<InviteDto[]> {
    const org = this.requestContextService.getOrgId().toString();
    const emails = payloads.map((p) => p.email);
    const users = await this.userService.getOrgUsersByEmails(org, emails);
    const filteredPayloads = payloads.filter(
      (p) => !users.find((u: UserDocument) => u.email.toLowerCase() === p.email.toLowerCase()),
    );
    const bulkOps = filteredPayloads.map((payload) => this.upsert(payload));
    const result = await Promise.all(bulkOps);
    return result;
  }

  async getInvites(): Promise<InviteDto[]> {
    const org = this.requestContextService.getOrgId();
    const result = await this.inviteModel
      .find({ org, _deleted: { $ne: true } })
      .select(Object.keys(new InviteDto()).join(' '))
      .sort({ updatedAt: -1 })
      .lean<InviteDocument[]>()
      .exec();
    return result.map((invite) => this.getTransformedInvite(invite));
  }

  async getPendingInviteByEmail(email: string): Promise<InviteDocument | null> {
    return await this.inviteModel
      .findOne({ email, status: InviteStatus.PENDING, _deleted: { $ne: true } })
      .sort({ createdAt: 1 })
      .lean<InviteDocument>()
      .exec();
  }

  /**
   * The invitee's own path, like `declineInvite`: not org-scoped, because the caller is not yet a
   * member of the inviting organization. `UserService` matches the invite's email against the
   * caller's before acting on the result.
   */
  async getPendingInviteById(inviteId: string): Promise<InviteDocument | null> {
    return await this.inviteModel
      .findOne({ _id: inviteId, status: InviteStatus.PENDING, _deleted: { $ne: true } })
      .lean<InviteDocument>()
      .exec();
  }

  /** Also the invitee's own path — see `getPendingInviteById` for why there is no org filter. */
  async acceptPendingInvite(inviteId: string): Promise<InviteDocument | null> {
    return await this.inviteModel
      .findOneAndUpdate(
        { _id: inviteId, status: InviteStatus.PENDING },
        { status: InviteStatus.ACCEPTED, acceptedDate: new Date() },
      )
      .lean<InviteDocument>()
      .exec();
  }

  async lookupInvite(inviteId: string): Promise<InviteLookupDto> {
    const invite = await this.inviteModel
      .findById(inviteId)
      .populate('role', 'role')
      .populate('org', 'name')
      .lean()
      .exec();
    if (!invite) {
      throw new NotFoundException('Invite not found.');
    }
    const role = invite.role as unknown as { role: string };
    const org = invite.org as unknown as { name: string };
    return {
      _id: invite._id.toString(),
      email: invite.email,
      status: invite.status,
      roleName: role?.role || '',
      orgName: org?.name,
    };
  }

  /**
   * The invitee declining. Not org-scoped on purpose: the caller is not a member of the inviting
   * organization. `UserService.declineInvite` has already checked that the invite's email is the
   * caller's own, which is the guard that matters here.
   */
  async declineInvite(inviteId: string): Promise<void> {
    const result = await this.inviteModel
      .findOneAndUpdate({ _id: inviteId, status: InviteStatus.PENDING }, { status: InviteStatus.DECLINED })
      .exec();
    if (!result) {
      throw new NotFoundException('Pending invite not found.');
    }
  }

  /**
   * Withdraws a pending invite, for an admin of the inviting organization.
   *
   * Deliberately a hard delete: the unique `{ email, org }` index counts soft-deleted rows, so
   * leaving the document would block ever re-inviting that address.
   */
  async deleteInvite(inviteId: string): Promise<void> {
    const org = this.requestContextService.getOrgId();
    const result = await this.inviteModel.deleteOne({ _id: inviteId, org, status: InviteStatus.PENDING }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Pending invite not found.');
    }
  }

  async resendInvite(inviteId: string): Promise<InviteDto> {
    const org = this.requestContextService.getOrgId();
    const invite = await this.inviteModel
      .findOneAndUpdate({ _id: inviteId, org, status: InviteStatus.PENDING }, { updatedAt: new Date() }, { new: true })
      .lean<InviteDocument>()
      .exec();
    if (!invite) {
      throw new NotFoundException('Pending invite not found.');
    }
    return this.getTransformedInvite(invite);
  }
}
