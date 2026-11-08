import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { WalletStatus, WalletType } from '../schemas/wallet.schema';

export class CreateWalletDto {
  @ApiPropertyOptional({
    example: '1234 5678 9012',
    description: 'Số tài khoản ví (tự sinh nếu không truyền)',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'NH Bank', description: 'Tên ví' })
  @IsOptional()
  @IsString()
  walletName?: string;

  @ApiProperty({ example: 'NGUYEN TUAN VU', description: 'Tên chủ sở hữu ví' })
  @IsString()
  ownerName: string;

  @ApiPropertyOptional({ example: 'KRW', default: 'KRW', description: 'Loại tiền tệ' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Số dư khả dụng' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  availableBalance?: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Số dư khả dụng hiển thị/chỉnh sửa' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  availableBalanceEdit?: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Tổng số dư' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBalance?: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Số dư đóng băng' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  frozenBalance?: number;

  @ApiPropertyOptional({
    enum: WalletType,
    default: WalletType.PERSONAL,
    description: 'Loại ví',
  })
  @IsOptional()
  @IsEnum(WalletType)
  walletType?: WalletType;

  @ApiPropertyOptional({
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
    description: 'Trạng thái ví',
  })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ example: 'SH', description: 'Mã ngân hàng liên kết (SH, KB, SHINHAN, HANA...)' })
  @IsOptional()
  @IsString()
  linkedBankCode?: string;

  @ApiPropertyOptional({ example: '수협', description: 'Tên ngân hàng liên kết' })
  @IsOptional()
  @IsString()
  linkedBankName?: string;

  @ApiPropertyOptional({ example: '0901 234 567', description: 'Số tài khoản ngân hàng liên kết' })
  @IsOptional()
  @IsString()
  linkedBankAccount?: string;

  @ApiPropertyOptional({ example: 'assets/images/bank/logo_wallet.png', description: 'Đường dẫn ảnh logo' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
