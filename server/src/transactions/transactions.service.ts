import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BanksService } from '../banks/banks.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  QueryTransactionsDto,
  TransactionSearchType,
  TransactionSortOrder,
  TransactionTypeFilter,
} from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionDocument, TransactionStatus } from './schemas/transaction.schema';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepo: TransactionsRepository,
    private readonly walletsService: WalletsService,
    private readonly banksService: BanksService,
  ) { }

  /**
   * Lấy danh sách giao dịch có bộ lọc và phân trang.
   */
  async getTransactions(userId: string, query: QueryTransactionsDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    // 1. Lọc theo loại giao dịch (전체 / 입금 / 출금)
    if (query.type === TransactionTypeFilter.DEPOSIT) {
      filter.isDeposit = true;
    } else if (query.type === TransactionTypeFilter.WITHDRAWAL) {
      filter.isDeposit = false;
    }

    // 2. Lọc theo thời gian thực tế của giao dịch (transferTime: YYYY.MM.DD)
    let startFilterTime: string | null = null;
    let endFilterTime: string | null = null;

    if (query.startDate || query.endDate) {
      // Ưu tiên ngày do người dùng chỉ định trực tiếp (직접입력)
      if (query.startDate) {
        startFilterTime = this.normalizeDateStr(query.startDate);
      }
      if (query.endDate) {
        endFilterTime = this.normalizeDateStr(query.endDate);
      }
    } else if (
      query.period &&
      query.period !== 'ALL' &&
      query.period !== 'CUSTOM'
    ) {
      // Lọc theo mốc thời gian nhanh (1M, 3M, 6M, 1Y)
      startFilterTime = this.getPeriodStartDate(query.period);
    }

    if (startFilterTime || endFilterTime) {
      const timeFilter: Record<string, string> = {};
      if (startFilterTime) {
        timeFilter.$gte = startFilterTime;
      }
      if (endFilterTime) {
        timeFilter.$lte = endFilterTime;
      }
      filter.transferTime = timeFilter;
    }

    // 3. Tìm kiếm từ khóa (예금주명 / 메모)
    if (query.keyword && query.keyword.trim()) {
      const keyword = query.keyword.trim();
      const regex = new RegExp(keyword, 'i');

      if (query.searchType === TransactionSearchType.HOLDER) {
        filter.$or = [
          { title: regex },
          { 'beneficiaryBank.accountName': regex },
          { 'paymentBank.accountName': regex },
        ];
      } else if (query.searchType === TransactionSearchType.MEMO) {
        filter.content = regex;
      } else {
        filter.$or = [
          { title: regex },
          { content: regex },
          { 'beneficiaryBank.accountName': regex },
        ];
      }
    }

    // 4. Lọc theo khoảng số tiền giao dịch (minAmount, maxAmount)
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      const amountFilter: Record<string, number> = {};
      if (query.minAmount !== undefined && !isNaN(Number(query.minAmount))) {
        amountFilter.$gte = Number(query.minAmount);
      }
      if (query.maxAmount !== undefined && !isNaN(Number(query.maxAmount))) {
        amountFilter.$lte = Number(query.maxAmount);
      }
      if (Object.keys(amountFilter).length > 0) {
        filter.transferAmount = amountFilter;
      }
    }

    // 5. Thứ tự sắp xếp (최신순 / 과거순) - theo thời gian giao dịch thực tế
    const sortDirection: 1 | -1 =
      query.sortOrder === TransactionSortOrder.OLDEST ? 1 : -1;
    const sort: Record<string, 1 | -1> = {
      transferTime: sortDirection,
      transferTimeDetail: sortDirection,
      createdAt: sortDirection,
    };

    const [items, total] = await Promise.all([
      this.transactionsRepo.findWithPagination(filter, sort, skip, limit),
      this.transactionsRepo.count(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Lấy chi tiết một giao dịch.
   */
  async getTransactionById(userId: string, id: string): Promise<TransactionDocument> {
    const tx = await this.transactionsRepo.findById(id);
    if (!tx) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    if (tx.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập giao dịch này');
    }
    return tx;
  }

  /**
   * Tạo giao dịch mới (tự động cập nhật số dư ví).
   */
  async createTransaction(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    const wallet = await this.walletsService.getMyWallet(userId);
    const isDeposit = dto.isDeposit ?? false;
    const fee = dto.fee ?? 0;
    const totalRequired = isDeposit ? 0 : dto.transferAmount + fee;

    if (!isDeposit && wallet.availableBalance < totalRequired) {
      throw new BadRequestException('Số dư khả dụng trong ví không đủ để thực hiện giao dịch');
    }

    // Tính toán số dư mới
    const delta = isDeposit ? dto.transferAmount : -totalRequired;
    const newAvailableBalance = Math.max(0, wallet.availableBalance + delta);
    const newTotalBalance = Math.max(0, wallet.totalBalance + delta);

    // Cập nhật số dư ví
    await this.walletsService.updateMyWallet(userId, {
      availableBalance: newAvailableBalance,
      availableBalanceEdit: newAvailableBalance,
      totalBalance: newTotalBalance,
    });

    // Xác định thông tin ngân hàng nhận
    let receiverBankName = dto.receiverBankName || 'K bank';
    let receiverImageUrl = 'assets/images/bank/k_bank.png';
    let receiverBankCode = dto.receiverBankCode || 'KBANK';

    if (dto.receiverBankCode) {
      try {
        const bank = await this.banksService.getBankByCode(dto.receiverBankCode);
        receiverBankName = bank.name;
        receiverImageUrl = bank.imageUrl;
        receiverBankCode = bank.code;
      } catch (_) { }
    }

    // Tạo mã giao dịch & thời gian theo giờ chuẩn KST (UTC+9)
    const now = new Date();
    const kstTime = now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000;
    const kstDate = new Date(kstTime);
    const defaultDateStr = `${kstDate.getFullYear()}.${String(kstDate.getMonth() + 1).padStart(2, '0')}.${String(kstDate.getDate()).padStart(2, '0')}`;
    const defaultTimeStr = `${String(kstDate.getHours()).padStart(2, '0')}:${String(kstDate.getMinutes()).padStart(2, '0')}:${String(kstDate.getSeconds()).padStart(2, '0')}`;

    const dateStr = dto.transferTime
      ? (this.normalizeDateStr(dto.transferTime) || defaultDateStr)
      : defaultDateStr;
    const timeStr = dto.transferTimeDetail || defaultTimeStr;
    const transferNumber = `1128OTT${Date.now().toString().slice(-9)}`;

    return this.transactionsRepo.save({
      userId: new Types.ObjectId(userId),
      walletId: new Types.ObjectId(wallet.id),
      transferNumber: dto.transferNumber || transferNumber,
      transferChannel: dto.transferChannel || 'NH Bank',
      transferTypeTag: dto.transferTypeTag || (isDeposit ? '입금' : '체크'),
      title: dto.title,
      content: dto.content || '',
      isDeposit,
      currency: dto.currency || wallet.currency || 'KRW',
      transferAmount: dto.transferAmount,
      fee,
      balanceAfter: dto.balanceAfter ?? newAvailableBalance,
      totalWithdrawalAmount: dto.totalWithdrawalAmount ?? (dto.balanceAfter ?? newAvailableBalance),
      status: (dto.status as TransactionStatus) || TransactionStatus.SUCCESS,
      paymentBank: dto.paymentBank || {
        bankCode: wallet.linkedBankCode || 'NH',
        name: wallet.linkedBankName || 'NH Bank',
        imageUrl: wallet.imageUrl || 'assets/images/bank/nh_bank.png',
        accountNumber: wallet.accountNumber,
        accountName: wallet.ownerName,
      },
      beneficiaryBank: dto.beneficiaryBank || {
        bankCode: receiverBankCode,
        name: receiverBankName,
        imageUrl: receiverImageUrl,
        accountNumber: dto.receiverAccountNumber || '9876 543 210',
        accountName: dto.receiverName || dto.title,
      },
      transferTime: dateStr,
      transferTimeDetail: timeStr,
    });
  }

  /**
   * Cập nhật thông tin giao dịch (cho phép sửa tất cả thông tin và tự động bù trừ số dư ví).
   */
  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionDocument> {
    const tx = await this.getTransactionById(userId, id);
    const wallet = await this.walletsService.getMyWallet(userId);

    // 1. Kiểm tra và tính toán bù trừ số dư nếu thay đổi số tiền, loại giao dịch hoặc phí
    const willChangeAmount =
      dto.transferAmount !== undefined && dto.transferAmount !== tx.transferAmount;
    const willChangeDeposit =
      dto.isDeposit !== undefined && dto.isDeposit !== tx.isDeposit;
    const willChangeFee = dto.fee !== undefined && dto.fee !== tx.fee;

    if (willChangeAmount || willChangeDeposit || willChangeFee) {
      const oldAmount = tx.transferAmount;
      const oldFee = tx.fee || 0;
      const oldContribution = tx.isDeposit ? oldAmount : -(oldAmount + oldFee);

      const newAmount = dto.transferAmount ?? tx.transferAmount;
      const newIsDeposit = dto.isDeposit ?? tx.isDeposit;
      const newFee = dto.fee !== undefined ? dto.fee : oldFee;
      const newContribution = newIsDeposit ? newAmount : -(newAmount + newFee);

      const delta = newContribution - oldContribution;
      const projectedBalance = wallet.availableBalance + delta;

      // Nếu số dư sau điều chỉnh < 0 thì KHÔNG cho sửa, ném lỗi 400
      if (projectedBalance < 0) {
        throw new BadRequestException(
          `Số dư ví không đủ để điều chỉnh giao dịch này. Số dư hiện tại: ${wallet.availableBalance} KRW, mức điều chỉnh cần thêm: ${Math.abs(delta)} KRW.`,
        );
      }

      await this.walletsService.updateMyWallet(userId, {
        availableBalance: projectedBalance,
        availableBalanceEdit: projectedBalance,
        totalBalance: Math.max(0, wallet.totalBalance + delta),
      });

      dto.balanceAfter = projectedBalance;
      dto.totalWithdrawalAmount = projectedBalance;
    }

    // 2. Nếu đổi mã ngân hàng nhận receiverBankCode, tự động cập nhật beneficiaryBank
    if (dto.receiverBankCode) {
      try {
        const bank = await this.banksService.getBankByCode(dto.receiverBankCode);
        if (!dto.beneficiaryBank) {
          dto.beneficiaryBank = {
            bankCode: bank.code,
            name: bank.name,
            imageUrl: bank.imageUrl,
            accountNumber:
              dto.receiverAccountNumber ||
              tx.beneficiaryBank?.accountNumber ||
              '9876 543 210',
            accountName:
              dto.receiverName ||
              dto.title ||
              tx.beneficiaryBank?.accountName ||
              tx.title,
          };
        } else {
          dto.beneficiaryBank.bankCode = bank.code;
          dto.beneficiaryBank.name = bank.name;
          dto.beneficiaryBank.imageUrl = bank.imageUrl;
        }
      } catch (_) { }
    }

    // Chuẩn hóa định dạng ngày nếu người dùng chỉnh sửa transferTime
    if (dto.transferTime) {
      dto.transferTime = this.normalizeDateStr(dto.transferTime) || dto.transferTime;
    }

    // 3. Cập nhật tất cả thông tin vào database
    const updated = await this.transactionsRepo.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    return updated;
  }

  /**
   * Xóa một giao dịch (không hoàn tác số dư ví).
   */
  async deleteTransaction(userId: string, id: string): Promise<{ message: string }> {
    await this.getTransactionById(userId, id);
    await this.transactionsRepo.delete(id);
    return { message: 'Xóa giao dịch thành công' };
  }

  /**
   * Chuẩn hóa chuỗi ngày thành định dạng YYYY.MM.DD đồng nhất.
   */
  private normalizeDateStr(val?: string): string | null {
    if (!val) return null;
    const cleaned = val.trim().replace(/[-/]/g, '.');
    const parts = cleaned.split('.');
    if (parts.length === 3) {
      const y = parts[0].padStart(4, '0');
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}.${m}.${d}`;
    }
    return cleaned;
  }

  /**
   * Tính ngày bắt đầu theo mốc thời gian (KST - Asia/Seoul UTC+9).
   */
  private getPeriodStartDate(period: string): string | null {
    const now = new Date();
    const kstTime = now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000;
    const kstDate = new Date(kstTime);

    if (period === '1M') {
      kstDate.setMonth(kstDate.getMonth() - 1);
    } else if (period === '3M') {
      kstDate.setMonth(kstDate.getMonth() - 3);
    } else if (period === '6M') {
      kstDate.setMonth(kstDate.getMonth() - 6);
    } else if (period === '1Y') {
      kstDate.setFullYear(kstDate.getFullYear() - 1);
    } else {
      return null;
    }

    const y = kstDate.getFullYear();
    const m = String(kstDate.getMonth() + 1).padStart(2, '0');
    const d = String(kstDate.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  }

}
