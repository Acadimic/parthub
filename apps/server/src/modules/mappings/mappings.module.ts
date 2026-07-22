import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StudentStandardMapping,
  StudentStandardMappingSchema,
} from './schemas/student-standard-mapping.schema';
import { UserStudentMapping, UserStudentMappingSchema } from './schemas/user-student-mapping.schema';
import { UserBatchMapping, UserBatchMappingSchema } from './schemas/user-batch-mapping.schema';
import {
  StudentProductMapping,
  StudentProductMappingSchema,
} from './schemas/student-product-mapping.schema';
import { StudentStandardMappingService } from './services/student-standard-mapping.service';
import { UserStudentMappingService } from './services/user-student-mapping.service';
import { UserBatchMappingService } from './services/user-batch-mapping.service';
import { MappingsController } from './mappings.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentStandardMapping.name, schema: StudentStandardMappingSchema },
      { name: UserStudentMapping.name, schema: UserStudentMappingSchema },
      { name: UserBatchMapping.name, schema: UserBatchMappingSchema },
      { name: StudentProductMapping.name, schema: StudentProductMappingSchema },
    ]),
  ],
  controllers: [MappingsController],
  providers: [StudentStandardMappingService, UserStudentMappingService, UserBatchMappingService],
  exports: [StudentStandardMappingService, UserStudentMappingService, UserBatchMappingService],
})
export class MappingsModule {}
