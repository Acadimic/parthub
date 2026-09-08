import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Material, MaterialDocument } from './material.schema';
import { MaterialDto } from '@repo/shared/validations';

@Injectable()
export class MaterialService {
  constructor(@InjectModel(Material.name) private materialModel: Model<MaterialDocument>) {}

  async upsert(org: Types.ObjectId, payload: MaterialDto): Promise<MaterialDocument> {
    const { _id } = payload;
    return this.materialModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
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
    return this.materialModel.find({ org, _deleted: { $ne: true } }).lean<MaterialDocument[]>();
  }

  async findById(org: Types.ObjectId, id: string) {
    return this.materialModel.findOne({ _id: id, org, _deleted: { $ne: true } }).lean<MaterialDocument>();
  }

  async findByCourse(org: Types.ObjectId, courseId: string) {
    return this.materialModel.find({ course: courseId, org, _deleted: { $ne: true } }).lean<MaterialDocument[]>();
  }
}
