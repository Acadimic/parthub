import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Standard, StandardSchema } from './standard.schema';
import { StandardSubjectMapping, StandardSubjectMappingSchema } from './standard-subject-mapping.schema';
import { StandardService } from './standard.service';
import { StandardSubjectMappingService } from './standard-subject-mapping.service';
import { StandardController } from './standard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Standard.name, schema: StandardSchema },
      { name: StandardSubjectMapping.name, schema: StandardSubjectMappingSchema },
    ]),
  ],
  controllers: [StandardController],
  providers: [StandardService, StandardSubjectMappingService],
  exports: [StandardService, StandardSubjectMappingService],
})
export class StandardModule {}
