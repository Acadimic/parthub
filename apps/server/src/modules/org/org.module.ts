import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrgController } from './org.controller';
import { Org, OrgSchema } from './org.schema';
import { OrgService } from './org.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Org.name, schema: OrgSchema }])],
  controllers: [OrgController],
  providers: [OrgService],
  exports: [OrgService],
})
export class OrgModule {}
