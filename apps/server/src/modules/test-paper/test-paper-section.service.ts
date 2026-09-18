import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getTransformedBaseFields } from '@database/base.transform';
import { InjectModel } from '@nestjs/mongoose';
import { TestPaperSectionDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { TestPaperSection, TestPaperSectionDocument } from './schemas/test-paper-section.schema';

@Injectable()
export class TestPaperSectionService {
  constructor(@InjectModel(TestPaperSection.name) private testPaperSectionModel: Model<TestPaperSectionDocument>) {}

  /**
   * The wire shape of a section.
   *
   * Spread rather than a field list, so a plain field added to the schema needs no change here.
   * Only the values whose stored type differs from the contract are named: an `ObjectId` becomes a
   * string, a `Date` an ISO string.
   *
   * `__v` is removed because the apps post a loaded row straight back on the next edit, where the
   * global `forbidNonWhitelisted` rejects it with "property __v should not exist".
   */
  getTransformedTestPaperSection(section: TestPaperSectionDocument): TestPaperSectionDto {
    // Cast only to make the delete legal: `HydratedDocument` types `__v` as required, and TypeScript
    // refuses `delete` on a non-optional property.
    delete (section as { __v?: number }).__v;
    return {
      ...section,
      ...getTransformedBaseFields(section),
      subsections: (section.subsections ?? []).map(String),
    };
  }

  /** The list form, for the `find()` routes. */
  getTransformedTestPaperSections(sections: TestPaperSectionDocument[]): TestPaperSectionDto[] {
    return (sections ?? []).map((section) => this.getTransformedTestPaperSection(section));
  }

  async upsert(org: Types.ObjectId, payload: TestPaperSectionDto): Promise<TestPaperSectionDto> {
    const { _id } = payload;
    return this.testPaperSectionModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<TestPaperSectionDocument>()
      .then((section) => {
        // `lean<T>()` states the element type and drops the `| null` an upsert can still return, so
        // the miss has to be checked rather than trusted.
        if (!section) throw new InternalServerErrorException('Test paper section was not saved.');
        return this.getTransformedTestPaperSection(section);
      });
  }

  async getByIds(org: Types.ObjectId, ids: string[]): Promise<TestPaperSectionDto[]> {
    if (!ids.length) return [];
    return this.testPaperSectionModel
      .find({ _id: { $in: ids }, org, _deleted: { $ne: true } })
      .lean<TestPaperSectionDocument[]>()
      .then((sections) => this.getTransformedTestPaperSections(sections));
  }
}
