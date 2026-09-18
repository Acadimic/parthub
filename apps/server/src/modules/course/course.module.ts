import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanModule } from '@modules/plan/plan.module';
import { Course, CourseSchema } from './course.schema';
import { CourseContent, CourseContentSchema } from './schemas/course-content.schema';
import { CompletedModule, CompletedModuleSchema } from './schemas/completed-module.schema';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: CourseContent.name, schema: CourseContentSchema },
      { name: CompletedModule.name, schema: CompletedModuleSchema },
    ]),
    PlanModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
