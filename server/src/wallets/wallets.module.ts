import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { BanksModule } from '../banks/banks.module';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletsController } from './wallets.controller';
import { WalletsRepository } from './wallets.repository';
import { WalletsService } from './wallets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    PassportModule,
    BanksModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService, WalletsRepository],
  exports: [WalletsService],
})
export class WalletsModule {}
