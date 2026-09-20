import { ActivityLogModule } from '@modules/activity-log/activity-log.module';
import { BatchModule } from '@modules/batch/batch.module';
import { BookmarkModule } from '@modules/bookmark/bookmark.module';
import { ChapterModule } from '@modules/chapter/chapter.module';
import { CommonModule } from '@modules/common/common.module';
import { CourseModule } from '@modules/course/course.module';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { FollowerModule } from '@modules/follower/follower.module';
import { InviteModule } from '@modules/invite/invite.module';
import { MappingsModule } from '@modules/mappings/mappings.module';
import { MaterialModule } from '@modules/material/material.module';
import { MeetModule } from '@modules/meet/meet.module';
import { OrgModule } from '@modules/org/org.module';
import { OtpModule } from '@modules/otp/otp.module';
import { PermissionModule } from '@modules/permissions/permission.module';
import { PlanModule } from '@modules/plan/plan.module';
import { QuestionModule } from '@modules/question/question.module';
import { RazorpayModule } from '@modules/razorpay/razorpay.module';
import { ReactionModule } from '@modules/reaction/reaction.module';
import { S3Module } from '@modules/s3/s3.module';
import { SendGridModule } from '@modules/sendgrid/sendgrid.module';
import { StandardModule } from '@modules/standard/standard.module';
import { SubjectModule } from '@modules/subject/subject.module';
import { TestPaperModule } from '@modules/test-paper/test-paper.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Secrets } from '@secrets/secrets';
import { Connection } from 'mongoose';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContextModule } from './context/context.module';
import { RequestContextService } from './context/request-context.service';
import { IndexSyncService } from './database/index-sync.service';
import { registerGlobalPlugins } from './database/plugins/register-plugins';
import { AccessGuard } from './guards/access.guard';
import { AuthGuard } from './guards/auth.guard';
import { ActivityLogCoreModule } from './modules/activity-log/activity-log-core.module';
import { ActivityLogCoreService } from './modules/activity-log/activity-log-core.service';
import { SecretsModule } from './secrets/secrets.module';
import { SecretsService } from './secrets/secrets.service';

@Module({
  imports: [
    SecretsModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ContextModule,
    ActivityLogCoreModule,
    MongooseModule.forRootAsync({
      inject: [SecretsService, RequestContextService, ActivityLogCoreService],
      useFactory: (
        secretsService: SecretsService,
        contextService: RequestContextService,
        activityLogCoreService: ActivityLogCoreService,
      ) => ({
        uri: secretsService.get(Secrets.DB_URL) as string,
        connectionFactory: (connection: Connection): Connection => {
          registerGlobalPlugins(connection, contextService, activityLogCoreService);
          return connection;
        },
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
        stream: pino.destination({
          minLength: 512,
          sync: true,
        }),
        serializers: {
          req(req: { headers: Record<string, unknown> }) {
            const headers = { ...req.headers };
            if (headers.authorization) {
              headers.authorization = '***';
            }
            return { ...req, headers };
          },
        },
        transport:
          process.env.APP_ENV === 'local'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
    PermissionModule,
    MappingsModule,
    OrgModule,
    UserModule,
    FirebaseModule,
    ActivityLogModule,
    InviteModule,
    StandardModule,
    SubjectModule,
    CourseModule,
    MaterialModule,
    ChapterModule,
    TestPaperModule,
    QuestionModule,
    BatchModule,
    MeetModule,
    PlanModule,
    BookmarkModule,
    ReactionModule,
    FollowerModule,
    OtpModule,
    S3Module,
    SendGridModule,
    RazorpayModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      // Registered second so it runs after AuthGuard has populated the request context.
      provide: APP_GUARD,
      useClass: AccessGuard,
    },
    AppService,
    IndexSyncService,
  ],
})
export class AppModule {}
