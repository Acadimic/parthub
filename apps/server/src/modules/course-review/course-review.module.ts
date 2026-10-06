import { CourseModule } from '@modules/course/course.module';
import { ReactionModule } from '@modules/reaction/reaction.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseReviewController } from './course-review.controller';
import { CourseReview, CourseReviewSchema } from './course-review.schema';
import { CourseReviewService } from './course-review.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CourseReview.name, schema: CourseReviewSchema }]),
    CourseModule,
    UserModule,
    ReactionModule,
  ],
  controllers: [CourseReviewController],
  providers: [CourseReviewService],
})
export class CourseReviewModule {}
