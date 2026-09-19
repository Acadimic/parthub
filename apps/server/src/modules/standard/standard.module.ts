import { Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Standard, StandardDocument, StandardSchema } from './standard.schema';
import {
  StandardSubjectMapping,
  StandardSubjectMappingDocument,
  StandardSubjectMappingSchema,
} from './standard-subject-mapping.schema';
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
export class StandardModule implements OnModuleInit {
  constructor(
    @InjectModel(Standard.name) private readonly standardModel: Model<StandardDocument>,
    @InjectModel(StandardSubjectMapping.name) private readonly mappingModel: Model<StandardSubjectMappingDocument>,
  ) {}

  /**
   * The unique indexes on both schemas changed from plain or sparse to partial, and Mongoose never
   * replaces an index whose options changed — see MaterialModule. A no-op once they match.
   */
  async onModuleInit(): Promise<void> {
    await Promise.all([this.standardModel.syncIndexes(), this.mappingModel.syncIndexes()]);
  }
}
