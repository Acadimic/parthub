import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument } from './material.schema';

@Injectable()
export class MaterialService {
  constructor(@InjectModel(Material.name) private materialModel: Model<MaterialDocument>) {}

  async findAll(org: string) {
    return this.materialModel.find({ orgId: org, _deleted: false });
  }

  async findById(id: string) {
    return this.materialModel.findById(id);
  }

  async findByCourse(courseId: string) {
    return this.materialModel.find({ course: courseId, _deleted: false });
  }
}
