import { Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument, MaterialSchema } from './material.schema';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Material.name, schema: MaterialSchema }])],
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule implements OnModuleInit {
  constructor(@InjectModel(Material.name) private readonly materialModel: Model<MaterialDocument>) {}

  /**
   * Mongoose creates missing indexes on its own but never replaces one whose options changed,
   * and the unique index above changed from sparse to partial. `syncIndexes` drops what the
   * schema no longer declares and builds what it does; when nothing differs it is a no-op.
   */
  async onModuleInit(): Promise<void> {
    await this.materialModel.syncIndexes();
  }
}
