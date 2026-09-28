import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '@modules/course/course.schema';
import { PlanModule } from '@modules/plan/plan.module';
import { RazorpayModule } from '@modules/razorpay/razorpay.module';
import { Enrollment, EnrollmentSchema } from './enrollment.schema';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';

@Module({
  imports: [
    // The course schema is registered here as well as in CourseModule: this module reads a course
    // to check it may be enrolled in, and CourseModule imports this one to gate its contents, so
    // importing CourseModule back would be circular.
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
    PlanModule,
    RazorpayModule,
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
