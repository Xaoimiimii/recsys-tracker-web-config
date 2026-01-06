import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ReturnMethodService } from './return-method.service';
import { JwtAuthGuard } from 'src/modules/auth/guard';
import { CreateReturnMethodDto } from './dto/create-return-method.dto';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateReturnMethodDto } from './dto/update-return-method.dto';

@Controller('return-method')
export class ReturnMethodController {
    constructor(private returnMethodService: ReturnMethodService) { }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all return methods by domain key' })
    @Get(':key')
    async getReturnMethods(@Param('key') key: string) {
        return this.returnMethodService.getReturnMethodsByDomainKey(key);
    }

    // @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new return method' })
    @Post()
    async createReturnMethod(@Body() dto: CreateReturnMethodDto) {
        const result = await this.returnMethodService.createReturnMethod(
            dto.Key,
            dto.ConfigurationName,
            dto.ReturnType,
            dto.Value,
            dto.OperatorId,
            dto.DelayDuration,
            dto.CustomizingFields || {},
            dto.LayoutJson,
            dto.StyleJson,
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

    // @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update an existing return method' })
    @Patch()
    async updateReturnMethod(@Body() dto: UpdateReturnMethodDto) {
        const result = await this.returnMethodService.updateReturnMethod(
            dto.Id,
            dto.ConfigurationName,
            dto.OperatorId,
            dto.Value,
            dto.CustomizingFields,
            dto.LayoutJson,
            dto.StyleJson,
            dto.DelayDuration,
        );

        if (!result) {
            throw new HttpException(
                { statusCode: 404, message: 'Some error occurred' },
                HttpStatus.NOT_FOUND,
            );
        }
        
        return {
            statusCode: HttpStatus.OK,
            message: 'Return method was updated successfully',
        };
    }

    // @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a return method by id' })
    async deleteReturnMethod(@Param('id', ParseIntPipe) id: number) {
        await this.returnMethodService.deleteReturnMethod(id);
        return {
            statusCode: HttpStatus.OK,
            message: 'Return method was deleted successfully',
        };
    }

    // @UseGuards(JwtAuthGuard)
    @Get('/detail/:id')
    @ApiOperation({ summary: 'Get a return method by id' })
    async getReturnMethodById(@Param('id', ParseIntPipe) id: number) {
        return this.returnMethodService.getReturnMethodById(id);
    }
}
