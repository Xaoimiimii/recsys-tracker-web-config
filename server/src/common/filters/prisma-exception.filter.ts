import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    HttpException,
    Logger
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  // 1. Khởi tạo Logger
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 2. LOG LỖI RA CONSOLE NGAY LẬP TỨC
    // Việc này giúp bạn thấy ngay dòng code nào gây lỗi và chi tiết lỗi là gì
    // replace(/\n/g, '') giúp log gọn gàng hơn trên 1 dòng nếu message quá dài
    this.logger.error(
      `Prisma Error [${exception.code}]: ${exception.message.replace(/\n/g, '')}`,
      exception.stack, // In ra stack trace để biết file nào gọi
    );

    switch (exception.code) {
      case 'P2002': // Unique constraint
        const fields = exception.meta?.target
          ? Array.isArray(exception.meta.target)
            ? exception.meta.target.join(', ')
            : exception.meta.target
          : 'unknown';
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: `Dữ liệu đã tồn tại (trùng lặp): ${fields}`,
          error: 'Conflict',
        });

      case 'P2003': // Foreign key fail
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Dữ liệu liên quan không hợp lệ (Foreign key constraint)',
          error: 'Bad Request',
        });

      case 'P2025': // Record not found
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Không tìm thấy dữ liệu',
          error: 'Not Found',
        });

      // 3. XỬ LÝ RIÊNG CHO P2021 (Bảng không tồn tại)
      case 'P2021': {
        const table = exception.meta?.table ?? 'unknown_table';
        const message = `Bảng '${table}' không tồn tại trong database hiện tại.`;
        
        // Log thêm warning nhấn mạnh
        this.logger.warn(`Lỗi schema nghiêm trọng: ${message}`);

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: message, // Trả về chi tiết để debug (lên prod nên ẩn đi)
          error: 'Database Schema Error',
        });
      }

      default:
        // Các lỗi khác
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Lỗi Database không xác định: ${exception.code}`,
          // Chỉ hiện chi tiết message nếu không phải môi trường production
          detail: process.env.NODE_ENV !== 'production' ? exception.message : undefined,
        });
    }
  }
}