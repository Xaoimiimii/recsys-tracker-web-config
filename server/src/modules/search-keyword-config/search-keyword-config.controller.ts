import { Body, Controller, Post } from '@nestjs/common';
import { SearchKeywordConfigService } from './search-keyword-config.service';
import { ApiOperation } from '@nestjs/swagger';
import { CreateSearchKeywordConfigDto } from './dto/create-search-keyword-config.dto';

@Controller('search-keyword-config')
export class SearchKeywordConfigController {
    constructor(private readonly searchKeywordConfigService: SearchKeywordConfigService) { }
    
    @Post()
    @ApiOperation({ summary: 'Create a new search keyword config' })
    async createConfig(@Body() body: CreateSearchKeywordConfigDto) {
        return this.searchKeywordConfigService.createSearchKeywordConfig(
            body.DomainKey,
            body.ConfigurationName,
            body.InputSelector
        );
    }
}
