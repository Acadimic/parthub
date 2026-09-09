import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrgType } from '@repo/shared/enums';
import { OrgDto, UpdateOrgDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { CreateOrgDto } from './org.dto';
import { Org, OrgDocument } from './org.schema';

@Injectable()
export class OrgService {
  constructor(@InjectModel(Org.name) private orgModel: Model<Org>) {}

  transformOrg(org: OrgDocument): OrgDto {
    return {
      ...org,
      _id: org._id.toString(),
      // Lean reads skip schema defaults, so orgs stored before `orgType` existed come back without it.
      orgType: org.orgType || OrgType.INDIVIDUAL,
      createdBy: org.createdBy?.toString(),
      updatedBy: org.updatedBy?.toString(),
    };
  }

  async upsert(payload: CreateOrgDto): Promise<OrgDocument> {
    return this.orgModel
      .findByIdAndUpdate(payload._id, { ...payload }, { upsert: true, returnDocument: 'after', runValidators: true })
      .lean<OrgDocument>();
  }

  async update(id: string | Types.ObjectId, payload: UpdateOrgDto): Promise<OrgDto> {
    const org = await this.orgModel
      .findByIdAndUpdate(id, { ...payload }, { returnDocument: 'after', runValidators: true })
      .lean<OrgDocument>();
    if (!org) throw new NotFoundException('Organization not found.');
    return this.transformOrg(org);
  }

  async getOrgsByIds(ids: string[]): Promise<OrgDto[]> {
    const orgs = await this.orgModel
      .find({ _id: { $in: ids }, _deleted: { $ne: true } })
      .select('_id name displayId logo orgType createdBy updatedBy createdAt updatedAt')
      .lean<OrgDocument[]>();
    return orgs.map((org) => this.transformOrg(org));
  }

  async getOrgById(id: string): Promise<OrgDto | null> {
    const org = await this.orgModel.findOne({ _id: id, _deleted: { $ne: true } }).lean<OrgDocument>();
    return org ? this.transformOrg(org) : null;
  }
}
