import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plan, PlanDocument } from './plan.schema';
import { UpsertPlanDto } from './dto/upsert-plan.dto';

@Injectable()
export class PlanService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async upsert(userId: Types.ObjectId, orgId: Types.ObjectId, payload: UpsertPlanDto): Promise<PlanDocument> {
    const { _id } = payload;
    return this.planModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<PlanDocument>();
  }

  async getCoursePlans(orgId: Types.ObjectId): Promise<PlanDocument[]> {
    return this.planModel.find({ orgId, _deleted: { $ne: true } }).lean<PlanDocument[]>();
  }

  async getPlanById(id: string): Promise<PlanDocument> {
    return this.planModel.findById(id).lean<PlanDocument>();
  }
}
