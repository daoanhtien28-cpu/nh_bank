# 💳 Tài Liệu Tích Hợp API Ví (Wallet) Cho Front-End (Web & Mobile)

- **Base URL:** `http://localhost:3000/api`
- **Swagger Documentation:** `http://localhost:3000/api/docs`
- **Module:** `Wallets`

---

## 1. Nguyên Tắc Hoạt Động (Business Logic)

1. **Mô hình 1 User = 1 Ví cố định:**
   - Mỗi tài khoản người dùng gắn liền với duy nhất **1 ví**.
   - **Tự động khởi tạo:** Ví được hệ thống **tự động tạo ngay khi đăng ký tài khoản thành công** (`POST /api/auth/register`). Nếu tài khoản cũ chưa có ví, hệ thống sẽ tự động khởi tạo khi gọi `GET /api/wallets` lần đầu tiên.
2. **Không có API tự tạo ví (`POST`):** Người dùng không cần và không thể tự bấm tạo ví thủ công.
3. **Không có API xóa ví (`DELETE`):** Ví gắn liền với vòng đời của tài khoản, không thể bị xoá.
4. **Không cần truyền `walletId`:** Front-end chỉ cần gắn `accessToken` vào Header, backend sẽ tự động nhận diện người dùng và xử lý ví tương ứng.

---

## 2. Cấu Trúc Dữ Liệu Ví (Wallet Schema)

Dữ liệu trả về chuẩn của một đối tượng Wallet:

```json
{
  "id": "6aab18917ec355abc1f45666",
  "userId": "6aab18917ec355abc1f45665",
  "accountNumber": "1234 5678 9012",
  "ownerName": "DAO ANH TIEN",
  "currency": "KRW",
  "availableBalance": 125500000,
  "availableBalanceEdit": 125500000,
  "totalBalance": 130000000,
  "frozenBalance": 4500000,
  "walletType": "PERSONAL",
  "status": "ACTIVE",
  "linkedBankCode": "KBANK",
  "linkedBankName": "K Bank",
  "linkedBankAccount": "0901 234 567",
  "imageUrl": "assets/images/bank/k_bank.png",
  "createdAt": "2026-09-17T05:30:41.572Z",
  "updatedAt": "2026-09-18T04:19:25.000Z"
}
```

### Bảng Giải Thích Chi Tiết Các Trường:

| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `string` | ID định danh của ví trong MongoDB |
| `userId` | `string` | ID người dùng sở hữu ví |
| `accountNumber` | `string` | Số tài khoản ví (VD: `"1234 5678 9012"`) |
| `ownerName` | `string` | Tên chủ sở hữu (viết hoa, mặc định theo tên đăng ký hoặc `"DAO ANH TIEN"`) |
| `currency` | `string` | Loại tiền tệ (mặc định: `"KRW"`) |
| `availableBalance` | `number` | Số dư khả dụng thực tế (VD: `125500000`) |
| `availableBalanceEdit` | `number` | Số dư hiển thị tùy chỉnh trên giao diện UI (VD: `125500000`) |
| `totalBalance` | `number` | Tổng số dư ví (`availableBalance + frozenBalance`) |
| `frozenBalance` | `number` | Số dư bị đóng băng / tạm giữ (VD: `4500000`) |
| `walletType` | `string` | Phân loại ví (`"PERSONAL"` hoặc `"BUSINESS"`) |
| `status` | `string` | Trạng thái ví (`"ACTIVE"`, `"LOCKED"`, `"PENDING"`) |
| `linkedBankCode` | `string` | Mã ngân hàng liên kết (`"KBANK"`, `"TOSS"`, `"BUSAN"`, `"SH"`...) |
| `linkedBankName` | `string` | Tên ngân hàng liên kết (VD: `"K bank"`, `"Toss Bank"`, `"BNK Busan Bank"`) |
| `linkedBankAccount` | `string` | Số tài khoản ngân hàng liên kết (VD: `"0901 234 567"`) |
| `imageUrl` | `string` | Đường dẫn ảnh đại diện logo ngân hàng (`"assets/images/bank/k_bank.png"`) |
| `createdAt` | `string` (ISO) | Thời gian tạo ví |
| `updatedAt` | `string` (ISO) | Thời gian cập nhật ví gần nhất |

---

## 3. Danh Sách Endpoints

### 3.1. Lấy thông tin ví của tôi (`GET /api/wallets`)

Lấy thông tin ví của người dùng đang đăng nhập.

* **Endpoint:** `/api/wallets`
* **Method:** `GET`
* **Headers:**
  * `Authorization: Bearer <accessToken>`

#### Response Thành Công (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "6aab18917ec355abc1f45666",
    "userId": "6aab18917ec355abc1f45665",
    "accountNumber": "1234 5678 9012",
    "ownerName": "DAO ANH TIEN",
    "currency": "KRW",
    "availableBalance": 125500000,
    "availableBalanceEdit": 125500000,
    "totalBalance": 130000000,
    "frozenBalance": 4500000,
    "walletType": "PERSONAL",
    "status": "ACTIVE",
    "linkedBankName": "HanaBank",
    "linkedBankAccount": "0901 234 567",
    "imageUrl": "assets/images/hana_bank.png",
    "createdAt": "2026-09-17T05:30:41.572Z",
    "updatedAt": "2026-09-17T05:30:41.572Z"
  },
  "timestamp": "2026-09-17T05:30:46.713Z"
}
```

#### Response Lỗi Thường Gặp
* **`401 Unauthorized`**: Token hết hạn hoặc không hợp lệ:
  ```json
  {
    "success": false,
    "statusCode": 401,
    "message": "Unauthorized",
    "timestamp": "2026-09-17T05:30:50.000Z",
    "path": "/api/wallets"
  }
  ```

---

### 3.2. Cập nhật thông tin / Số dư ví (`PATCH /api/wallets`)

Cập nhật trực tiếp ví của người dùng đang đăng nhập mà **không cần truyền `walletId`**.

Front-End có thể gửi cập nhật một hoặc nhiều trường tùy chỉnh:
- Cập nhật số dư hiển thị `availableBalanceEdit`
- Cập nhật số dư thực tế `availableBalance`, `totalBalance`, `frozenBalance`
- **Đổi ngân hàng liên kết tiện lợi:** FE chỉ cần gửi `linkedBankCode` (VD: `"KB"`, `"SHINHAN"`, `"WOORI"...`), Backend sẽ **tự động tra cứu và đồng bộ chuẩn** `linkedBankName` và `imageUrl` theo bảng Bank!
- Thay đổi tên chủ ví `ownerName`, trạng thái `status`

* **Endpoint:** `/api/wallets`
* **Method:** `PATCH`
* **Headers:**
  * `Authorization: Bearer <accessToken>`
  * `Content-Type: application/json`

#### Request Body Mẫu 1 (Đổi ngân hàng liên kết theo `linkedBankCode`):
```json
{
  "linkedBankCode": "KB",
  "linkedBankAccount": "0901 234 567"
}
```

#### Request Body Mẫu 2 (Cập nhật số dư):
```json
{
  "availableBalanceEdit": 250000000,
  "availableBalance": 250000000,
  "totalBalance": 254500000
}
```

#### Response Thành Công (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "6aab18917ec355abc1f45666",
    "userId": "6aab18917ec355abc1f45665",
    "accountNumber": "1234 5678 9012",
    "ownerName": "DAO ANH TIEN",
    "currency": "KRW",
    "availableBalance": 250000000,
    "availableBalanceEdit": 250000000,
    "totalBalance": 254500000,
    "frozenBalance": 4500000,
    "walletType": "PERSONAL",
    "status": "ACTIVE",
    "linkedBankCode": "KB",
    "linkedBankName": "Kookmin Bank",
    "linkedBankAccount": "0901 234 567",
    "imageUrl": "assets/images/kb_bank.png",
    "createdAt": "2026-09-17T05:30:41.572Z",
    "updatedAt": "2026-09-17T05:35:12.810Z"
  },
  "timestamp": "2026-09-17T05:35:12.859Z"
}
```

---

## 4. Code Mẫu Tích Hợp Flutter (Dart)

### 4.1. Model Class `WalletModel`

```dart
class WalletModel {
  final String id;
  final String userId;
  final String accountNumber;
  final String ownerName;
  final String currency;
  final double availableBalance;
  final double availableBalanceEdit;
  final double totalBalance;
  final double frozenBalance;
  final String walletType;
  final String status;
  final String linkedBankCode;
  final String linkedBankName;
  final String linkedBankAccount;
  final String imageUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  WalletModel({
    required this.id,
    required this.userId,
    required this.accountNumber,
    required this.ownerName,
    required this.currency,
    required this.availableBalance,
    required this.availableBalanceEdit,
    required this.totalBalance,
    required this.frozenBalance,
    required this.walletType,
    required this.status,
    this.linkedBankCode = 'HANA',
    required this.linkedBankName,
    required this.linkedBankAccount,
    required this.imageUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      id: json['id'] ?? json['_id'] ?? '',
      userId: json['userId'] ?? '',
      accountNumber: json['accountNumber'] ?? '',
      ownerName: json['ownerName'] ?? '',
      currency: json['currency'] ?? 'KRW',
      availableBalance: (json['availableBalance'] as num?)?.toDouble() ?? 0.0,
      availableBalanceEdit: (json['availableBalanceEdit'] as num?)?.toDouble() ?? 0.0,
      totalBalance: (json['totalBalance'] as num?)?.toDouble() ?? 0.0,
      frozenBalance: (json['frozenBalance'] as num?)?.toDouble() ?? 0.0,
      walletType: json['walletType'] ?? 'PERSONAL',
      status: json['status'] ?? 'ACTIVE',
      linkedBankCode: json['linkedBankCode'] ?? 'HANA',
      linkedBankName: json['linkedBankName'] ?? '',
      linkedBankAccount: json['linkedBankAccount'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accountNumber': accountNumber,
      'ownerName': ownerName,
      'currency': currency,
      'availableBalance': availableBalance,
      'availableBalanceEdit': availableBalanceEdit,
      'totalBalance': totalBalance,
      'frozenBalance': frozenBalance,
      'walletType': walletType,
      'status': status,
      'linkedBankCode': linkedBankCode,
      'linkedBankName': linkedBankName,
      'linkedBankAccount': linkedBankAccount,
      'imageUrl': imageUrl,
    };
  }
}
```

### 4.2. Wallet API Service (`wallet_service.dart`)

```dart
import 'package:dio/dio.dart';

class WalletService {
  final Dio _dio;

  WalletService(this._dio);

  /// Lấy thông tin ví của user hiện tại
  Future<WalletModel> getMyWallet() async {
    try {
      final response = await _dio.get('/wallets');
      if (response.data['success'] == true) {
        return WalletModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['message'] ?? 'Không thể tải thông tin ví');
    } catch (e) {
      rethrow;
    }
  }

  /// Cập nhật thông tin ví hoặc số dư
  Future<WalletModel> updateMyWallet(Map<String, dynamic> updateData) async {
    try {
      final response = await _dio.patch('/wallets', data: updateData);
      if (response.data['success'] == true) {
        return WalletModel.fromJson(response.data['data']);
      }
      throw Exception(response.data['message'] ?? 'Cập nhật ví thất bại');
    } catch (e) {
      rethrow;
    }
  }
}
```

---

## 5. Tóm Tắt Khác Biệt Quan Trọng

| Hành động | Phương thức | Cần ID? | Giải thích |
| :--- | :--- | :---: | :--- |
| **Tạo ví** | ❌ Không có | - | Tự động tạo khi đăng ký tài khoản |
| **Xóa ví** | ❌ Không có | - | Không thể xóa ví |
| **Xem ví** | `GET /api/wallets` | **Không** | Tự lấy ví của user theo token |
| **Sửa ví** | `PATCH /api/wallets` | **Không** | Sửa trực tiếp ví của user theo token |
