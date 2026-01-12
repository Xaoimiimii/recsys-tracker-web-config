import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiQuery } from '@nestjs/swagger/dist/decorators/api-query.decorator';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }
    
    @Get()
    @ApiQuery({ name: 'domainId', type: Number, required: true })
    @ApiQuery({ name: 'keyword', type: String, required: true })
    async getSearchResults(
        @Query('domainId', ParseIntPipe) domainId: number,
        @Query('keyword') keyword: string,
    ) {
        return this.searchService.search(domainId, keyword);
    }
}
