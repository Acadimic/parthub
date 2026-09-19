import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { LinkCheckService } from './link-check.service';
import { CommonController } from './common.controller';
import { S3Module } from '@modules/s3/s3.module';
import { SubjectModule } from '@modules/subject/subject.module';
import { StandardModule } from '@modules/standard/standard.module';

@Module({
  imports: [S3Module, SubjectModule, StandardModule],
  controllers: [CommonController],
  providers: [CommonService, LinkCheckService],
  exports: [CommonService],
})
export class CommonModule {}
