import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
} from '@nestjs/common';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        if (exception.code && exception.clientVersion) {
            switch (exception.code) {
                case 'P2002': // Unique constraint
                    return response.status(HttpStatus.BAD_REQUEST).json({
                        statusCode: 400,
                        message: `Unique constraint failed on field(s): ${exception.meta?.target}`,
                    });

                case 'P2003': // Foreign key fail
                    return response.status(400).json({
                        statusCode: 400,
                        message: 'Foreign key constraint failed',
                    });

                case 'P2025': // Record not found
                    return response.status(404).json({
                        statusCode: 404,
                        message: 'Record not found',
                    });

                default:
                    return response.status(500).json({
                        statusCode: 500,
                        message: `Database error: ${exception.code}`,
                    });
            }
        }

        if (exception.name === 'PrismaClientValidationError') {
            return response.status(400).json({
                statusCode: 400,
                message: exception.message,
            });
        }

        console.error(exception);
        return response.status(500).json({
            statusCode: 500,
            message: 'Internal server error',
        });
    }
}
