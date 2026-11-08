import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { normalizePattern } from '../common/utils/pattern.util';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from './schemas/user.schema';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existingEmail = await this.usersRepo.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const normalizedPhone = dto.phoneNumber ? dto.phoneNumber.trim() : undefined;
    if (normalizedPhone) {
      const existingPhone = await this.usersRepo.findByPhoneNumber(normalizedPhone);
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    let cardNumber = dto.cardNumber;
    if (cardNumber) {
      const existingCard = await this.usersRepo.findByCardNumber(cardNumber);
      if (existingCard) {
        throw new ConflictException('Số thẻ đã được sử dụng');
      }
    } else {
      cardNumber = await this.generateUniqueCardNumber();
    }

    const hashedPassword = await bcrypt.hash(normalizePattern(dto.password), 10);

    const userData: Partial<User> = {
      cardNumber,
      email: normalizedEmail,
      password: hashedPassword,
      fullName: dto.fullName?.trim(),
      isActive: true,
    };

    if (normalizedPhone) {
      userData.phoneNumber = normalizedPhone;
    }
    if (dto.homePhone) {
      userData.homePhone = dto.homePhone.trim();
    }
    if (dto.address) {
      userData.address = dto.address.trim();
    }

    return this.usersRepo.save(userData);
  }

  private async generateUniqueCardNumber(): Promise<string> {
    let cardNumber = '';
    let exists = true;
    while (exists) {
      const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      cardNumber = `9704${random12}`;
      const found = await this.usersRepo.findByCardNumber(cardNumber);
      if (!found) {
        exists = false;
      }
    }
    return cardNumber;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  async findByCardNumber(cardNumber: string): Promise<UserDocument | null> {
    return this.usersRepo.findByCardNumber(cardNumber);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepo.findByEmail(email);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
    return this.usersRepo.findByPhoneNumber(phoneNumber);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const updateData: Partial<User> = {};

    if (dto.fullName !== undefined) {
      updateData.fullName = dto.fullName.trim();
    }

    if (dto.phoneNumber !== undefined) {
      const cleanPhone = dto.phoneNumber.trim();
      if (cleanPhone) {
        const existing = await this.usersRepo.findByPhoneNumber(cleanPhone);
        if (existing && existing.id !== userId) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }
        updateData.phoneNumber = cleanPhone;
      } else {
        updateData.phoneNumber = undefined;
      }
    }

    if (dto.email !== undefined) {
      const cleanEmail = dto.email.toLowerCase().trim();
      if (cleanEmail) {
        const existing = await this.usersRepo.findByEmail(cleanEmail);
        if (existing && existing.id !== userId) {
          throw new ConflictException('Email đã được sử dụng');
        }
        updateData.email = cleanEmail;
      } else {
        updateData.email = undefined;
      }
    }

    if (dto.homePhone !== undefined) {
      updateData.homePhone = dto.homePhone.trim();
    }

    if (dto.address !== undefined) {
      updateData.address = dto.address.trim();
    }

    const updated = await this.usersRepo.update(userId, updateData);
    if (!updated) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return updated;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);

    const isMatch = await bcrypt.compare(
      normalizePattern(dto.currentPassword),
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const isSameAsOld = await bcrypt.compare(
      normalizePattern(dto.newPassword),
      user.password,
    );
    if (isSameAsOld) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu cũ',
      );
    }

    const newHashed = await bcrypt.hash(
      normalizePattern(dto.newPassword),
      10,
    );
    await this.usersRepo.update(userId, { password: newHashed });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashed = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.usersRepo.update(userId, { refreshToken: hashed ?? undefined });
  }
}
