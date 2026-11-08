import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) { }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByCardNumber(cardNumber: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ cardNumber }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    if (!email) return null;
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
    if (!phoneNumber) return null;
    const trimmed = phoneNumber.trim();
    const clean = trimmed.replace(/[\s-]/g, '');
    return this.userModel.findOne({
      $or: [
        { phoneNumber: trimmed },
        { phoneNumber: clean },
        { phoneNumber: { $regex: new RegExp(`^${clean.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-?$2-?$3')}$`) } },
      ],
    }).exec();
  }

  async save(user: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async update(
    id: string,
    partial: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, partial, { returnDocument: 'after' })
      .exec();
  }
}
