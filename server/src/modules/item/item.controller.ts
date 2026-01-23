import { Body, Controller, ParseArrayPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ItemService } from './item.service';
import { JwtAuthGuard } from '../auth/guard';
import { CreateItemDto } from './dto/create-items.dto';
import { UpdateItemDto } from './dto/update-item.dto';

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
    async updateItems(
        @Body(new ParseArrayPipe({ items: UpdateItemDto, whitelist: true})) dtos: UpdateItemDto[]
    ) {
        return this.itemService.updateBulk(dtos);
    }
}
