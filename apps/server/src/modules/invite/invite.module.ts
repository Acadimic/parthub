import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InviteController } from './invite.controller';
import { Invite, InviteSchema } from './invite.schema';
import { InviteService } from './invite.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }]), UserModule],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
