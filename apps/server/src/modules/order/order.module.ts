import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '@modules/course/course.schema';
import { EnrollmentModule } from '@modules/enrollment/enrollment.module';
import { MeetModule } from '@modules/meet/meet.module';
import { OrgModule } from '@modules/org/org.module';
import { PlanModule } from '@modules/plan/plan.module';
import { RazorpayModule } from '@modules/razorpay/razorpay.module';
import { Coupon, CouponSchema } from './coupon.schema';
import { CouponService } from './coupon.service';
import { Order, OrderSchema } from './order.schema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Coupon.name, schema: CouponSchema },
      // Read for course names when a snapshot is taken; registered here to avoid importing
      // CourseModule, which imports EnrollmentModule, which this module also needs.
      { name: Course.name, schema: CourseSchema },
    ]),
    PlanModule,
    EnrollmentModule,
    MeetModule,
    OrgModule,
    RazorpayModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, CouponService],
  exports: [OrderService, CouponService],
})
export class OrderModule {}
