import { CourseModule } from '@modules/course/course.module';
import { MaterialModule } from '@modules/material/material.module';
import { ReactionModule } from '@modules/reaction/reaction.module';
import { S3Module } from '@modules/s3/s3.module';
import { TestPaperModule } from '@modules/test-paper/test-paper.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseCommentController } from './course-comment.controller';
import { CourseComment, CourseCommentSchema } from './course-comment.schema';
import { CourseCommentService } from './course-comment.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CourseComment.name, schema: CourseCommentSchema }]),
    CourseModule,
    UserModule,
    ReactionModule,
    MaterialModule,
    TestPaperModule,
    S3Module,
  ],
  controllers: [CourseCommentController],
  providers: [CourseCommentService],
})
export class CourseCommentModule {}
