import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Batch, BatchSchema } from './batch.schema';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }])],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}
