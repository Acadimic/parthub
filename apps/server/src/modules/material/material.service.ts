import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material, MaterialDocument } from './material.schema';
import { UpsertMaterialDto } from '@parthhub/shared/validations';

@Injectable()
export class MaterialService {
  constructor(@InjectModel(Material.name) private materialModel: Model<MaterialDocument>) {}

  async upsert(userId: Types.ObjectId, org: Types.ObjectId, payload: UpsertMaterialDto): Promise<MaterialDocument> {
    const { _id } = payload;
    return this.materialModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<MaterialDocument>();
  }

  async getOrgMaterials(org: Types.ObjectId): Promise<MaterialDocument[]> {
    return this.materialModel.find({ org, _deleted: { $ne: true } }).lean<MaterialDocument[]>();
  }

  async getStandardAndSubjectMaterials(
    org: Types.ObjectId,
    standard: string,
    subject: string,
  ): Promise<MaterialDocument[]> {
    return this.materialModel
      .find({ org, standard, subject, _deleted: { $ne: true } })
      .sort({ order: 1 })
      .lean<MaterialDocument[]>();
  }

  async findAll(org: string) {
    return this.materialModel.find({ org, _deleted: false }).lean<MaterialDocument[]>();
  }

  async findById(org: Types.ObjectId, id: string) {
    return this.materialModel.findOne({ _id: id, org, _deleted: { $ne: true } }).lean<MaterialDocument>();
  }

  async findByCourse(org: Types.ObjectId, courseId: string) {
    return this.materialModel.find({ course: courseId, org, _deleted: { $ne: true } }).lean<MaterialDocument[]>();
  }
}
