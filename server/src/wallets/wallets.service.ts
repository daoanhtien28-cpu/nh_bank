import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BanksService } from '../banks/banks.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletDocument, WalletStatus, WalletType } from './schemas/wallet.schema';
import { WalletsRepository } from './wallets.repository';

@Injectable()
export class WalletsService {
  constructor(
    private readonly walletsRepo: WalletsRepository,
    private readonly banksService: BanksService,
  ) { }

  /**
   * Lấy ví duy nhất của người dùng hiện tại (tự tạo ví mặc định nếu chưa có).
   */
  async getMyWallet(userId: string, defaultOwnerName?: string): Promise<WalletDocument> {
    let wallet = await this.walletsRepo.findOneByUserId(userId);
    if (!wallet) {
      wallet = await this.createDefaultWallet(userId, defaultOwnerName || 'NGUYEN TUAN VU');
    }
    return wallet;
  }

  /**
   * Cập nhật ví của người dùng hiện tại mà không cần truyền walletId.
   */
  async updateMyWallet(
    userId: string,
    dto: UpdateWalletDto,
  ): Promise<WalletDocument> {
    const wallet = await this.getMyWallet(userId);

    // Tự động đồng bộ thông tin ngân hàng nếu truyền linkedBankCode
    if (dto.linkedBankCode) {
      try {
        const bank = await this.banksService.getBankByCode(dto.linkedBankCode);
        dto.linkedBankCode = bank.code;
        dto.linkedBankName = bank.name;
        if (!dto.walletName) {
          dto.walletName = bank.name;
        }
        dto.imageUrl = bank.imageUrl;
      } catch (_) { }
    }

    const updated = await this.walletsRepo.update(wallet.id, dto);
    if (!updated) {
      throw new NotFoundException('Ví không tồn tại');
    }
    return updated;
  }

  /**
   * Lấy danh sách ví của người dùng hiện tại.
   */
  async getMyWallets(userId: string, defaultOwnerName?: string): Promise<WalletDocument[]> {
    const wallet = await this.getMyWallet(userId, defaultOwnerName);
    return [wallet];
  }


  /**
   * Lấy chi tiết ví theo ID (chỉ chủ sở hữu mới xem được).
   */
  async getWalletById(userId: string, walletId: string): Promise<WalletDocument> {
    const wallet = await this.walletsRepo.findById(walletId);
    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }
    if (wallet.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập ví này');
    }
    return wallet;
  }

  /**
   * Tạo ví mới cho người dùng.
   */
  async createWallet(userId: string, dto: CreateWalletDto): Promise<WalletDocument> {
    const accountNumber = dto.accountNumber || this.generateAccountNumber();

    const existing = await this.walletsRepo.findByAccountNumber(accountNumber);
    if (existing) {
      throw new ConflictException('Số tài khoản ví này đã tồn tại');
    }

    const availableBalance = dto.availableBalance ?? 0;
    const availableBalanceEdit = dto.availableBalanceEdit ?? availableBalance;
    const frozenBalance = dto.frozenBalance ?? 0;
    const totalBalance = dto.totalBalance ?? availableBalance + frozenBalance;

    return this.walletsRepo.save({
      userId: new Types.ObjectId(userId),
      accountNumber,
      walletName: dto.walletName || dto.linkedBankName || 'NH Bank',
      ownerName: dto.ownerName,
      currency: dto.currency || 'KRW',
      availableBalance,
      availableBalanceEdit,
      totalBalance,
      frozenBalance,
      walletType: dto.walletType || WalletType.PERSONAL,
      status: dto.status || WalletStatus.ACTIVE,
      linkedBankCode: dto.linkedBankCode || 'NH',
      linkedBankName: dto.linkedBankName || 'NH Bank',
      linkedBankAccount: dto.linkedBankAccount || '',
      imageUrl: dto.imageUrl || 'assets/images/bank/nh_bank.png',
    });
  }

  /**
   * Cập nhật ví (chỉ chủ sở hữu).
   */
  async updateWallet(
    userId: string,
    walletId: string,
    dto: UpdateWalletDto,
  ): Promise<WalletDocument> {
    await this.getWalletById(userId, walletId);

    // Tự động đồng bộ thông tin ngân hàng nếu truyền linkedBankCode
    if (dto.linkedBankCode) {
      try {
        const bank = await this.banksService.getBankByCode(dto.linkedBankCode);
        dto.linkedBankCode = bank.code;
        dto.linkedBankName = bank.name;
        if (!dto.walletName) {
          dto.walletName = bank.name;
        }
        dto.imageUrl = bank.imageUrl;
      } catch (_) { }
    }

    const updated = await this.walletsRepo.update(walletId, dto);
    if (!updated) {
      throw new NotFoundException('Ví không tồn tại');
    }
    return updated;
  }

  /**
   * Xóa ví (chỉ chủ sở hữu).
   */
  async deleteWallet(userId: string, walletId: string): Promise<{ message: string }> {
    await this.getWalletById(userId, walletId);
    await this.walletsRepo.delete(walletId);
    return { message: 'Xóa ví thành công' };
  }

  /**
   * Tạo ví mặc định với thông tin ngân hàng mặc định.
   */
  async createDefaultWallet(userId: string, ownerName: string): Promise<WalletDocument> {
    let bank: { code: string; name: string; imageUrl: string };
    try {
      bank = await this.banksService.getBankByCode('NH');
    } catch (_) {
      const allBanks = await this.banksService.getAllBanks();
      bank = allBanks.length > 0 ? allBanks[0] : {
        code: 'NH',
        name: 'NH Bank',
        imageUrl: 'assets/images/bank/nh_bank.png',
      };
    }

    const existingDefault = await this.walletsRepo.findByAccountNumber('1234 5678 9012');
    const accountNumber = existingDefault ? this.generateAccountNumber() : '1234 5678 9012';

    return this.walletsRepo.save({
      userId: new Types.ObjectId(userId),
      accountNumber,
      walletName: bank.name || 'NH Bank',
      ownerName: ownerName.toUpperCase(),
      currency: 'KRW',
      availableBalance: 0,
      availableBalanceEdit: 0,
      totalBalance: 0,
      frozenBalance: 0,
      walletType: WalletType.PERSONAL,
      status: WalletStatus.ACTIVE,
      linkedBankCode: bank.code,
      linkedBankName: bank.name,
      linkedBankAccount: '0901 234 567',
      imageUrl: bank.imageUrl,
    });
  }

  private generateAccountNumber(): string {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const part3 = Math.floor(1000 + Math.random() * 9000);
    return `${part1} ${part2} ${part3}`;
  }
}
