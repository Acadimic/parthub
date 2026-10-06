import { UserModule } from '@modules/user/user.module';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InviteController } from './invite.controller';
import { Invite, InviteSchema } from './invite.schema';
import { InviteService } from './invite.service';

@Module({
  // Both sides of the User <-> Invite cycle are forward references, so the graph builds whichever
  // of the two files is loaded first.
  imports: [MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }]), forwardRef(() => UserModule)],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
