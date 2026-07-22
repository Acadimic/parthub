import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './otp.schema';
import { CreateOtpDto } from './dto/create-otp.dto';

@Injectable()
export class OtpService {
  constructor(@InjectModel(Otp.name) private otpModel: Model<OtpDocument>) {}

  async create(payload: CreateOtpDto): Promise<OtpDocument> {
    return this.otpModel.create(payload);
  }

  async findOne(filter: Partial<Otp>): Promise<OtpDocument> {
    return this.otpModel.findOne(filter).lean<OtpDocument>();
  }

  async update(id: string, update: Partial<Otp>): Promise<OtpDocument> {
    return this.otpModel.findByIdAndUpdate(id, update, { new: true }).lean<OtpDocument>();
  }
}
