import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'NGUYEN TUAN VU',
    description: 'Họ và tên người dùng',
  })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email người dùng',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu (đúng 6 chữ số)',
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @Matches(/^[0-9]{6}$/, { message: 'Mật khẩu phải gồm đúng 6 chữ số' })
  password: string;

  @ApiPropertyOptional({
    example: '010-2761-0689',
    description: 'Số điện thoại di động người dùng',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại di động phải là chuỗi ký tự' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '010 27610689',
    description: 'Số điện thoại nhà',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại nhà phải là chuỗi ký tự' })
  homePhone?: string;

  @ApiPropertyOptional({
    example: 'Seoul, Hàn Quốc',
    description: 'Địa chỉ nhà',
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ nhà phải là chuỗi ký tự' })
  address?: string;

  @ApiPropertyOptional({
    example: '9704123456789012',
    description: 'Số thẻ ngân hàng (tùy chọn)',
  })
  @IsOptional()
  @IsString({ message: 'Số thẻ phải là chuỗi ký tự' })
  cardNumber?: string;
}
