import { AppConfigModule, AppConfigService } from '@config';
import { FirebaseAuthGuard } from '@guards';
import { AuthModule } from '@modules/auth/auth.module';
import { ChapterModule } from '@modules/chapter/chapter.module';
import { CourseModule } from '@modules/course/course.module';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { MaterialModule } from '@modules/material/material.module';
import { OrgModule } from '@modules/org/org.module';
import { QuestionModule } from '@modules/question/question.module';
import { SubjectModule } from '@modules/subject/subject.module';
import { TestPaperModule } from '@modules/test-paper/test-paper.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingInterceptor } from './interceptor/logging.interceptor';

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        uri: configService.dbUrl,
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
          req(req: any) {
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
    UserModule,
    AuthModule,
    FirebaseModule,
    OrgModule,
    SubjectModule,
    CourseModule,
    MaterialModule,
    ChapterModule,
    TestPaperModule,
    QuestionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule {}
