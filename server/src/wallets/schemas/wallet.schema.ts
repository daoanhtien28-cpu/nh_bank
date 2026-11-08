import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

export enum WalletType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  SAVINGS = 'SAVINGS',
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class Wallet {
  id: string; // Virtual property mapped from _id

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  accountNumber: string;

  @Prop({ default: 'NH' })
  walletName: string;

  @Prop({ required: true })
  ownerName: string;

  @Prop({ default: 'KRW' })
  currency: string;

  @Prop({ default: 0 })
  availableBalance: number;

  @Prop({ default: 0 })
  availableBalanceEdit: number;

  @Prop({ default: 0 })
  totalBalance: number;

  @Prop({ default: 0 })
  frozenBalance: number;

  @Prop({ default: WalletType.PERSONAL, enum: WalletType })
  walletType: string;

  @Prop({ default: WalletStatus.ACTIVE, enum: WalletStatus })
  status: string;

  @Prop({ default: 'NH', uppercase: true, trim: true })
  linkedBankCode: string;

  @Prop({ default: 'NH Bank' })
  linkedBankName: string;

  @Prop({ default: '' })
  linkedBankAccount: string;

  @Prop({ default: 'assets/images/bank/nh_bank.png' })
  imageUrl: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

WalletSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});
