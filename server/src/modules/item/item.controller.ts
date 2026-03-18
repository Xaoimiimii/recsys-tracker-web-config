import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseArrayPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { ItemService } from './item.service';
import { JwtAuthGuard } from '../auth/guard';
import { CreateItemDto } from './dto/create-items.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { DeleteItemsDto } from './dto/delete-items.dto';

@Controller('item')
export class ItemController {
    constructor(private itemService: ItemService) { }

    // @UseGuards(JwtAuthGuard)
    @Post('create')
    async createItems(
        @Body(new ParseArrayPipe({ items: CreateItemDto, whitelist: true })) dtos: CreateItemDto[]
    ) {
        return this.itemService.createBulk(dtos);
    }

    @Patch()
    @ApiBody({ type: UpdateItemDto, isArray: true })
    async updateItems(
        @Body(new ParseArrayPipe({ items: UpdateItemDto, whitelist: true})) dtos: UpdateItemDto[]
    ) {
        return this.itemService.updateBulk(dtos);
    }

    @Get(':domainKey')
    async getItemsByDomain(
        @Param('domainKey') key: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
    ) {
        return this.itemService.getItemsByDomainKey(key, page, size);
    }

    @Delete()
    async deleteItems(
        @Body() dto: DeleteItemsDto,
    ) {
        return this.itemService.deleteItemsByDomainKey(dto.DomainKey, dto.DomainItemIds);
    }
}
