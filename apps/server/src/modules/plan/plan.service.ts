import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getTransformedBaseFields } from '@database/base.transform';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plan, PlanDocument } from './plan.schema';
import { PlanDto } from '@repo/shared/validations';

@Injectable()
export class PlanService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  /**
   * The wire shape of a plan.
   *
   * Spread rather than a field list, so a plain field added to the schema needs no change here.
   * Only the values whose stored type differs from the contract are named: an `ObjectId` becomes a
   * string, a `Date` an ISO string.
   *
   * `__v` is removed because the apps post a loaded row straight back on the next edit, where the
   * global `forbidNonWhitelisted` rejects it with "property __v should not exist".
   */
  getTransformedPlan(plan: PlanDocument): PlanDto {
    // Cast only to make the delete legal: `HydratedDocument` types `__v` as required, and TypeScript
    // refuses `delete` on a non-optional property.
    delete (plan as { __v?: number }).__v;
    return {
      ...plan,
      ...getTransformedBaseFields(plan),
      courses: (plan.courses ?? []).map(String),
      meets: (plan.meets ?? []).map(String),
      user: plan.user?.toString(),
    };
  }

  /** The list form, for the `find()` routes. */
  getTransformedPlans(plans: PlanDocument[]): PlanDto[] {
    return (plans ?? []).map((plan) => this.getTransformedPlan(plan));
  }

  async upsert(org: Types.ObjectId, payload: PlanDto): Promise<PlanDto> {
    const { _id } = payload;
    return this.planModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<PlanDocument>()
      .then((plan) => {
        // `lean<T>()` states the element type and drops the `| null` an upsert can still return, so
        // the miss has to be checked rather than trusted.
        if (!plan) throw new InternalServerErrorException('Plan was not saved.');
        return this.getTransformedPlan(plan);
      });
  }

  async getCoursePlans(org: Types.ObjectId): Promise<PlanDto[]> {
    return this.planModel
      .find({ org, _deleted: { $ne: true } })
      .lean<PlanDocument[]>()
      .then((plans) => this.getTransformedPlans(plans));
  }

  /** One plan of the caller's organization, for the route; a deleted or foreign plan reads as missing. */
  async getOrgPlanById(org: Types.ObjectId, id: string): Promise<PlanDto | null> {
    return this.planModel
      .findOne({ _id: id, org, _deleted: { $ne: true } })
      .lean<PlanDocument>()
      .then((plan) => (plan ? this.getTransformedPlan(plan) : null));
  }

  /**
   * Any plan by id, deleted or not and in any organization. Server-side only: a payment settles on
   * the plan its seat was sold on even after that plan is removed, and order creation checks the
   * organization itself. Never expose it through a route.
   */
  async getPlanById(id: string): Promise<PlanDto | null> {
    return this.planModel
      .findById(id)
      .lean<PlanDocument>()
      .then((plan) => (plan ? this.getTransformedPlan(plan) : null));
  }

  /** The plans a course is sold under, in the order the pricing table shows them. */
  async getPlansByCourseId(org: Types.ObjectId, courseId: string): Promise<PlanDto[]> {
    return this.planModel
      .find({ org, courses: courseId, _deleted: { $ne: true } })
      .sort({ order: 1 })
      .lean<PlanDocument[]>()
      .then((plans) => this.getTransformedPlans(plans));
  }
}
