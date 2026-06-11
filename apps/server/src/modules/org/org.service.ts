import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Org, OrgDocument } from './org.schema';

@Injectable()
export class OrgService {
  constructor(@InjectModel(Org.name) private orgModel: Model<OrgDocument>) {}

  async findAll() {
    return this.orgModel.find({ isDeleted: false });
  }

  async findById(id: string) {
    return this.orgModel.findById(id);
  }
}
