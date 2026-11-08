import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Lỗi máy chủ nội bộ';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
      }
    } else if ((exception as any)?.code === 11000 || (exception as any)?.name === 'MongoServerError') {
      status = HttpStatus.CONFLICT;
      const keyPattern = (exception as any)?.keyPattern || (exception as any)?.keyValue;
      if (keyPattern?.email) {
        message = 'Email đã được sử dụng';
      } else if (keyPattern?.phoneNumber) {
        message = 'Số điện thoại đã được sử dụng';
      } else if (keyPattern?.cardNumber) {
        message = 'Số thẻ đã được sử dụng';
      } else if (keyPattern?.accountNumber) {
        message = 'Số tài khoản ví đã tồn tại';
      } else {
        message = 'Dữ liệu đã tồn tại trong hệ thống';
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
