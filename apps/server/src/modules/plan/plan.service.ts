import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plan, PlanDocument } from './plan.schema';
import { PlanDto } from '@repo/shared/validations';

@Injectable()
export class PlanService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async upsert(org: Types.ObjectId, payload: PlanDto): Promise<PlanDocument> {
    const { _id } = payload;
    return this.planModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<PlanDocument>();
  }

  async getCoursePlans(org: Types.ObjectId): Promise<PlanDocument[]> {
    return this.planModel.find({ org, _deleted: { $ne: true } }).lean<PlanDocument[]>();
  }

  async getPlanById(id: string): Promise<PlanDocument> {
    return this.planModel.findById(id).lean<PlanDocument>();
  }
}
