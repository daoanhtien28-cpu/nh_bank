import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BankDocument } from './schemas/bank.schema';
import { BanksRepository } from './banks.repository';

export const INITIAL_KOREAN_BANKS = [
  // ── Hàng 1 ──────────────────────────────────
  {
    code: 'NH',
    name: 'NongHyup',
    shortName: 'NongHyup',
    binCode: '011',
    color: '#00A062',
    imageUrl: 'assets/images/bank/nh_bank.png',
    order: 1,
    isActive: true,
  },
  {
    code: 'KB',
    name: 'KB Kookmin Bank',
    shortName: 'KB',
    binCode: '004',
    color: '#796751',
    imageUrl: 'assets/images/bank/kb_bank.png',
    order: 2,
    isActive: true,
  },
  // ── Hàng 2 ──────────────────────────────────
  {
    code: 'IBK',
    name: 'Industrial Bank of Korea',
    shortName: 'IBK',
    binCode: '003',
    color: '#1A4B9C',
    imageUrl: 'assets/images/bank/ibk_bank.png',
    order: 3,
    isActive: true,
  },
  {
    code: 'KDB',
    name: 'Korea Development Bank',
    shortName: 'KDB Bank',
    binCode: '002',
    color: '#0C4DA2',
    imageUrl: 'assets/images/bank/kdb_bank.png',
    order: 4,
    isActive: true,
  },
  // ── Hàng 3 ──────────────────────────────────
  {
    code: 'SHINHAN',
    name: 'Shinhan Bank',
    shortName: 'Shinhan',
    binCode: '088',
    color: '#0046FF',
    imageUrl: 'assets/images/bank/shinhan_bank.png',
    order: 5,
    isActive: true,
  },
  {
    code: 'WOORI',
    name: 'Woori Bank',
    shortName: 'Woori',
    binCode: '020',
    color: '#0067AC',
    imageUrl: 'assets/images/bank/woori_bank.png',
    order: 6,
    isActive: true,
  },
  // ── Hàng 4 ──────────────────────────────────
  {
    code: 'HANA',
    name: 'Hana Bank',
    shortName: 'Hana Bank',
    binCode: '081',
    color: '#008485',
    imageUrl: 'assets/images/bank/hana_bank.png',
    order: 7,
    isActive: true,
  },
  {
    code: 'CITI',
    name: 'Citibank Korea',
    shortName: 'Citi Bank',
    binCode: '027',
    color: '#002D72',
    imageUrl: 'assets/images/bank/citi_bank.png',
    order: 8,
    isActive: true,
  },
  // ── Hàng 5 ──────────────────────────────────
  {
    code: 'SC',
    name: 'Standard Chartered Bank Korea',
    shortName: 'SC Bank',
    binCode: '023',
    color: '#00A3E0',
    imageUrl: 'assets/images/bank/sc_bank.png',
    order: 9,
    isActive: true,
  },
  {
    code: 'KAKAO',
    name: 'Kakao Bank',
    shortName: 'Kakao Bank',
    binCode: '090',
    color: '#FEE500',
    imageUrl: 'assets/images/bank/kakao_bank.png',
    order: 10,
    isActive: true,
  },
  // ── Hàng 6 ──────────────────────────────────
  {
    code: 'KBANK',
    name: 'K Bank',
    shortName: 'K bank',
    binCode: '089',
    color: '#00E676',
    imageUrl: 'assets/images/bank/k_bank.png',
    order: 11,
    isActive: true,
  },
  {
    code: 'TOSS',
    name: 'Toss Bank',
    shortName: 'Toss Bank',
    binCode: '092',
    color: '#0064FF',
    imageUrl: 'assets/images/bank/toss_bank.png',
    order: 12,
    isActive: true,
  },
  // ── Hàng 7 ──────────────────────────────────
  {
    code: 'KYONGNAM',
    name: 'BNK Kyongnam Bank',
    shortName: 'BNK Kyongnam Bank',
    binCode: '039',
    color: '#C51D24',
    imageUrl: 'assets/images/bank/bnk_kyongnam_bank.png',
    order: 13,
    isActive: true,
  },
  {
    code: 'KWANGJU',
    name: 'Gwangju Bank',
    shortName: 'Gwangju Bank',
    binCode: '034',
    color: '#003882',
    imageUrl: 'assets/images/bank/gwangju_bank.png',
    order: 14,
    isActive: true,
  },
  // ── Hàng 8 ──────────────────────────────────
  {
    code: 'DGB',
    name: 'iM Bank',
    shortName: 'iM Bank (formerly D...',
    binCode: '031',
    color: '#0077C8',
    imageUrl: 'assets/images/bank/im_bank.png',
    order: 15,
    isActive: true,
  },
  {
    code: 'BUSAN',
    name: 'BNK Busan Bank',
    shortName: 'BNK Busan Bank',
    binCode: '032',
    color: '#E30613',
    imageUrl: 'assets/images/bank/bnk_busan_bank.png',
    order: 16,
    isActive: true,
  },
  // ── Hàng 9 ──────────────────────────────────
  {
    code: 'JEONBUK',
    name: 'Jeonbuk Bank',
    shortName: 'JB Bank',
    binCode: '037',
    color: '#004B9B',
    imageUrl: 'assets/images/bank/jb_bank.png',
    order: 17,
    isActive: true,
  },
  {
    code: 'SH',
    name: 'Suhyup Bank',
    shortName: 'Suhyup',
    binCode: '007',
    color: '#005596',
    imageUrl: 'assets/images/bank/suhyup_bank.png',
    order: 18,
    isActive: true,
  },
  // ── Hàng 10 ─────────────────────────────────
  {
    code: 'JEJU',
    name: 'Jeju Bank',
    shortName: 'Jeju Bank',
    binCode: '035',
    color: '#004B9B',
    imageUrl: 'assets/images/bank/jeju_bank.png',
    order: 19,
    isActive: true,
  },
  {
    code: 'KMSFC',
    name: 'National Forestry Cooperative Federation',
    shortName: 'NFCF',
    binCode: '064',
    color: '#2E7D32',
    imageUrl: 'assets/images/bank/nfcf.png',
    order: 20,
    isActive: true,
  },
  // ── Hàng 11 ─────────────────────────────────
  {
    code: 'CU',
    name: 'National Credit Union Federation',
    shortName: 'National Credit Uni...',
    binCode: '048',
    color: '#004380',
    imageUrl: 'assets/images/bank/national_credit_union.png',
    order: 21,
    isActive: true,
  },
  {
    code: 'KFCC',
    name: 'MG Community Credit Cooperatives',
    shortName: 'MG Community Cre...',
    binCode: '045',
    color: '#005DAA',
    imageUrl: 'assets/images/bank/mg_community_credit.png',
    order: 22,
    isActive: true,
  },
];

@Injectable()
export class BanksService implements OnModuleInit {
  private readonly logger = new Logger(BanksService.name);

  constructor(private readonly banksRepo: BanksRepository) { }

  async onModuleInit() {
    await this.seedInitialBanks();
  }

  /**
   * Lấy danh sách ngân hàng đang hoạt động, sắp xếp theo order.
   */
  async getAllBanks(includeInactive = false): Promise<BankDocument[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return this.banksRepo.findAll(filter);
  }

  /**
   * Lấy chi tiết ngân hàng theo ID.
   */
  async getBankById(id: string): Promise<BankDocument> {
    const bank = await this.banksRepo.findById(id);
    if (!bank) {
      throw new NotFoundException(`Ngân hàng với ID ${id} không tồn tại`);
    }
    return bank;
  }

  /**
   * Lấy chi tiết ngân hàng theo mã định danh (vd: HANA, KB, SHINHAN...).
   */
  async getBankByCode(code: string): Promise<BankDocument> {
    const upperCode = code.toUpperCase();
    let bank = await this.banksRepo.findByCode(upperCode);
    if (!bank) {
      if (upperCode === 'SUHYUP') {
        bank = await this.banksRepo.findByCode('SH');
      } else if (upperCode === 'SH') {
        bank = await this.banksRepo.findByCode('SUHYUP');
      }
    }
    if (!bank) {
      throw new NotFoundException(`Ngân hàng với mã "${code}" không tồn tại`);
    }
    return bank;
  }

  /**
   * Khởi tạo hoặc cập nhật đồng bộ danh sách ngân hàng mẫu.
   */
  async seedInitialBanks(): Promise<void> {
    try {
      this.logger.log('Đang đồng bộ thứ tự và thông tin ngân hàng Hàn Quốc...');
      for (const bank of INITIAL_KOREAN_BANKS) {
        await this.banksRepo.upsertByCode(bank.code, bank);
      }
      // Xóa các ngân hàng dư thừa không thuộc danh sách 22 ngân hàng
      const validCodes = INITIAL_KOREAN_BANKS.map((b) => b.code);
      await this.banksRepo.deleteMany({ code: { $nin: validCodes } });
      this.logger.log(`Đồng bộ thành công ${INITIAL_KOREAN_BANKS.length} ngân hàng (đã xóa các ngân hàng dư).`);
    } catch (error) {
      this.logger.error('Lỗi khi đồng bộ dữ liệu banks:', error);
    }
  }
}
