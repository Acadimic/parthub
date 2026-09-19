import { Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument, SubjectSchema } from './subject.schema';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { StandardModule } from '@modules/standard/standard.module';

@Module({
  // StandardModule for the mapping service: deleting a subject soft-deletes its mappings too.
  imports: [MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }]), StandardModule],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule implements OnModuleInit {
  constructor(@InjectModel(Subject.name) private readonly subjectModel: Model<SubjectDocument>) {}

  /** The unique indexes changed from plain or sparse to partial — see StandardModule. */
  async onModuleInit(): Promise<void> {
    await this.subjectModel.syncIndexes();
  }
}
