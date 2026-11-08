import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu hiện tại',
  })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi ký tự' })
  currentPassword: string;

  @ApiProperty({
    example: '654321',
    description: 'Mật khẩu mới (đúng 6 chữ số)',
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @Matches(/^[0-9]{6}$/, { message: 'Mật khẩu mới phải gồm đúng 6 chữ số' })
  newPassword: string;
}
