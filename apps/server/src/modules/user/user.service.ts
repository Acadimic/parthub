import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getByOrgAndUid(params: { uid: string; permission: string; org: string }): Promise<UserDocument> {
    return this.userModel.findOne({
      uid: params.uid,
      org: params.org,
      permission: params.permission,
      isDeleted: false,
    });
  }

  async updateLastActive(userId: string, date: Date) {
    return this.userModel.findByIdAndUpdate(userId, { lastActive: date });
  }

  async getInitialLoginData(uid: string) {
    return { message: 'Initial login data', uid };
  }
}
