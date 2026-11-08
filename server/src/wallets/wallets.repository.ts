import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';

@Injectable()
export class WalletsRepository {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
  ) { }

  async findOneByUserId(userId: string): Promise<WalletDocument | null> {
    return this.walletModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findByUserId(userId: string): Promise<WalletDocument[]> {
    return this.walletModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }


  async findById(id: string): Promise<WalletDocument | null> {
    return this.walletModel.findById(id).exec();
  }

  async findByAccountNumber(accountNumber: string): Promise<WalletDocument | null> {
    return this.walletModel.findOne({ accountNumber }).exec();
  }

  async save(wallet: Partial<Wallet>): Promise<WalletDocument> {
    const createdWallet = new this.walletModel(wallet);
    return createdWallet.save();
  }

  async update(
    id: string,
    partial: Partial<Wallet>,
  ): Promise<WalletDocument | null> {
    return this.walletModel
      .findByIdAndUpdate(id, partial, { returnDocument: 'after' })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.walletModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
