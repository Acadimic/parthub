import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material, MaterialDocument } from './material.schema';
import { UpsertMaterialDto } from '@parthhub/shared/validations';

@Injectable()
export class MaterialService {
  constructor(@InjectModel(Material.name) private materialModel: Model<MaterialDocument>) {}

  async upsert(userId: Types.ObjectId, orgId: Types.ObjectId, payload: UpsertMaterialDto): Promise<MaterialDocument> {
    const { _id } = payload;
    return this.materialModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<MaterialDocument>();
  }

  async getOrgMaterials(orgId: Types.ObjectId): Promise<MaterialDocument[]> {
    return this.materialModel.find({ orgId, _deleted: { $ne: true } }).lean<MaterialDocument[]>();
  }

  async getStandardAndSubjectMaterials(
    orgId: Types.ObjectId,
    standard: string,
    subject: string,
  ): Promise<MaterialDocument[]> {
    return this.materialModel
      .find({ orgId, standard, subject, _deleted: { $ne: true } })
      .sort({ order: 1 })
      .lean<MaterialDocument[]>();
  }

  async findAll(org: string) {
    return this.materialModel.find({ orgId: org, _deleted: false }).lean<MaterialDocument[]>();
  }

  async findById(id: string) {
    return this.materialModel.findById(id).lean<MaterialDocument>();
  }

  async findByCourse(courseId: string) {
    return this.materialModel.find({ course: courseId, _deleted: false }).lean<MaterialDocument[]>();
  }
}
