import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from './subject.schema';
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
export class SubjectModule {}
