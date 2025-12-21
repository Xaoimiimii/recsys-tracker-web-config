import { Body, Controller, ParseArrayPipe, Post, UseGuards } from '@nestjs/common';
import { ItemService } from './item.service';
import { JwtAuthGuard } from '../auth/guard';
import { CreateItemDto } from './dto/create-items.dto';

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
}
