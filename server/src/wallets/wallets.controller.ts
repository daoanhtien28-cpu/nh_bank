import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserDocument } from '../users/schemas/user.schema';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletsService } from './wallets.service';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin ví của người dùng hiện tại (tự tạo ví mặc định nếu chưa có)' })
  @ApiResponse({ status: 200, description: 'Thông tin ví của người dùng' })
  async getMyWallet(@CurrentUser() user: UserDocument) {
    return this.walletsService.getMyWallet(user.id, user.fullName || 'NGUYEN TUAN VU');
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật ví của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật ví thành công' })
  async updateMyWallet(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletsService.updateMyWallet(user.id, dto);
  }
}
