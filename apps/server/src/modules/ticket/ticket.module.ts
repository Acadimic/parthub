import { CourseModule } from '@modules/course/course.module';
import { EnrollmentModule } from '@modules/enrollment/enrollment.module';
import { MaterialModule } from '@modules/material/material.module';
import { OrderModule } from '@modules/order/order.module';
import { QuestionModule } from '@modules/question/question.module';
import { S3Module } from '@modules/s3/s3.module';
import { SendGridModule } from '@modules/sendgrid/sendgrid.module';
import { TestPaperModule } from '@modules/test-paper/test-paper.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketMailService } from './ticket-mail.service';
import { TicketTargetService } from './ticket-target.service';
import { TicketController } from './ticket.controller';
import { Ticket, TicketSchema } from './ticket.schema';
import { TicketService } from './ticket.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    CourseModule,
    EnrollmentModule,
    OrderModule,
    MaterialModule,
    TestPaperModule,
    QuestionModule,
    UserModule,
    S3Module,
    SendGridModule,
  ],
  controllers: [TicketController],
  providers: [TicketService, TicketTargetService, TicketMailService],
})
export class TicketModule {}
