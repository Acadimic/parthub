import { Injectable } from '@nestjs/common';
import { getTransformedBaseFields } from '@database/base.transform';
import { InjectModel } from '@nestjs/mongoose';
import { MaterialDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { Material, MaterialDocument } from './material.schema';

@Injectable()
export class MaterialService {
  constructor(@InjectModel(Material.name) private materialModel: Model<MaterialDocument>) {}

  /**
   * The wire shape of a material.
   *
   * Spread rather than a field list, so a plain field added to the schema needs no change here.
   * Only the values whose stored type differs from the contract are named: an `ObjectId` becomes a
   * string, a `Date` an ISO string.
   *
   * `__v` is removed because the apps post a loaded row straight back on the next edit, where the
   * global `forbidNonWhitelisted` rejects it with "property __v should not exist".
   */
  getTransformedMaterial(material: MaterialDocument): MaterialDto {
    // Cast only to make the delete legal: `HydratedDocument` types `__v` as required, and TypeScript
    // refuses `delete` on a non-optional property.
    delete (material as { __v?: number }).__v;
    return {
      ...material,
      ...getTransformedBaseFields(material),
      standard: material.standard?.toString(),
      subject: material.subject?.toString(),
      chapter: material.chapter?.toString(),
      course: material.course?.toString(),
    };
  }

  /** The list form, for the `find()` routes. */
  getTransformedMaterials(materials: MaterialDocument[]): MaterialDto[] {
    return (materials ?? []).map((material) => this.getTransformedMaterial(material));
  }

  async upsert(org: Types.ObjectId, payload: MaterialDto): Promise<MaterialDto> {
    const { _id } = payload;
    return this.materialModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<MaterialDocument>()
      .then((material) => this.getTransformedMaterial(material));
  }

  async getOrgMaterials(org: Types.ObjectId): Promise<MaterialDto[]> {
    return this.materialModel
      .find({ org, _deleted: { $ne: true } })
      .lean<MaterialDocument[]>()
      .then((materials) => this.getTransformedMaterials(materials));
  }

  async getStandardAndSubjectMaterials(org: Types.ObjectId, standard: string, subject: string): Promise<MaterialDto[]> {
    return this.materialModel
      .find({ org, standard, subject, _deleted: { $ne: true } })
      .sort({ order: 1 })
      .lean<MaterialDocument[]>()
      .then((materials) => this.getTransformedMaterials(materials));
  }

  /** The materials for a set of standards — what a teacher's standard filter asks for in one call. */
  async getMaterialsByStandardIds(org: Types.ObjectId, standardIds: string[]): Promise<MaterialDto[]> {
    return this.materialModel
      .find({ org, standard: { $in: standardIds }, _deleted: { $ne: true } })
      .sort({ order: 1 })
      .lean<MaterialDocument[]>()
      .then((materials) => this.getTransformedMaterials(materials));
  }

  async findAll(org: string) {
    return this.materialModel
      .find({ org, _deleted: { $ne: true } })
      .lean<MaterialDocument[]>()
      .then((materials) => this.getTransformedMaterials(materials));
  }

  async findById(org: Types.ObjectId, id: string) {
    return this.materialModel
      .findOne({ _id: id, org, _deleted: { $ne: true } })
      .lean<MaterialDocument>()
      .then((material) => (material ? this.getTransformedMaterial(material) : null));
  }

  async findByCourse(org: Types.ObjectId, courseId: string) {
    return this.materialModel
      .find({ course: courseId, org, _deleted: { $ne: true } })
      .lean<MaterialDocument[]>()
      .then((materials) => this.getTransformedMaterials(materials));
  }
}
