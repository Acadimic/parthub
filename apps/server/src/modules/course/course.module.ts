import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './course.schema';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
