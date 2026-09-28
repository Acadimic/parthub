import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanModule } from '@modules/plan/plan.module';
import { MaterialModule } from '@modules/material/material.module';
import { TestPaperModule } from '@modules/test-paper/test-paper.module';
import { MeetModule } from '@modules/meet/meet.module';
import { EnrollmentModule } from '@modules/enrollment/enrollment.module';
import { Course, CourseSchema } from './course.schema';
// Aliased: the schema class and this file's Nest module are both called `CourseModule`. The alias
// is only local — `CourseModuleEntity.name` is still 'CourseModule', which is the model name
// `CompletedModule.courseModule` refs.
import { CourseModule as CourseModuleEntity, CourseModuleSchema } from './schemas/course-module.schema';
import { CompletedModule, CompletedModuleSchema } from './schemas/completed-module.schema';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: CourseModuleEntity.name, schema: CourseModuleSchema },
      { name: CompletedModule.name, schema: CompletedModuleSchema },
    ]),
    PlanModule,
    // The course screen returns each module with its items embedded, so it reads through the
    // services that own those collections rather than re-registering their schemas here.
    MaterialModule,
    TestPaperModule,
    MeetModule,
    // Seats gate a paid course's contents, so the reads here ask it before answering.
    EnrollmentModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
