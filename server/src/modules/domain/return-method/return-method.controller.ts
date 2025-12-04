import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ReturnMethodService } from './return-method.service';
import { JwtAuthGuard } from 'src/modules/auth/guard';
import { CreateReturnMethodsDto } from './dto/create-return-method.dto';

@Controller('domain/return-method')
export class ReturnMethodController {
    constructor(private returnMethodService: ReturnMethodService) {}

    // @UseGuards(JwtAuthGuard)
    @Get(':key')
    async getReturnMethods(@Req() req, @Param('key') key: string) {
        return this.returnMethodService.getReturnMethodsByDomainKey(key);
    }

    // @UseGuards(JwtAuthGuard)
    @Post()
    async createReturnMethods(@Body() dto: CreateReturnMethodsDto) {
        const result = await this.returnMethodService.createReturnMethods(
            dto.key,
            dto.slotName,
            dto.returnMethodId,
            dto.value,
            dto.targetUrl,
        );

        if (!result) {
            throw new HttpException(
                { statusCode: 404, message: 'Some error occurred' },
                HttpStatus.NOT_FOUND,
            );
        }

        return {
            statusCode: HttpStatus.CREATED,
            message: 'Return method was created successfully',
        };
    }
}
