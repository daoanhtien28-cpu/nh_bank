import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'NGUYEN TUAN VU', description: 'Họ và tên mới của người dùng' })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({ example: '010-2761-0689', description: 'Số điện thoại di động' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại di động phải là chuỗi ký tự' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email người dùng' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiPropertyOptional({ example: '010 27610689', description: 'Số điện thoại nhà' })
  @IsOptional()
  @IsString({ message: 'Số điện thoại nhà phải là chuỗi ký tự' })
  homePhone?: string;

  @ApiPropertyOptional({ example: 'Seoul, Hàn Quốc', description: 'Địa chỉ nhà' })
  @IsOptional()
  @IsString({ message: 'Địa chỉ nhà phải là chuỗi ký tự' })
  address?: string;
}
