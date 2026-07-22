import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrgDto } from '@parthhub/shared/validations';
import { Model } from 'mongoose';
import { CreateOrgDto } from './org.dto';
import { Org, OrgDocument } from './org.schema';

@Injectable()
export class OrgService {
  constructor(@InjectModel(Org.name) private orgModel: Model<Org>) {}

  transformOrg(org: OrgDocument): OrgDto {
    return {
      ...org,
      _id: org._id.toString(),
    };
  }

  async upsert(payload: CreateOrgDto): Promise<OrgDocument> {
    return this.orgModel
      .findByIdAndUpdate(payload._id, { ...payload }, { upsert: true, new: true, runValidators: true })
      .lean<OrgDocument>();
  }

  async getOrgsByIds(ids: string[]): Promise<OrgDto[]> {
    const orgs = await this.orgModel
      .find({ _id: { $in: ids } })
      .select(Object.keys(new OrgDto()).join(' '))
      .lean<OrgDocument[]>();
    return orgs.map((org) => this.transformOrg(org));
  }

  async getOrgById(id: string): Promise<OrgDto | null> {
    const org = await this.orgModel.findOne({ _id: id }).lean<OrgDocument>();
    return org ? this.transformOrg(org) : null;
  }
}
