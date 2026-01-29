import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SearchKeywordConfigService } from './search-keyword-config.service';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateSearchKeywordConfigDto } from './dto/create-search-keyword-config.dto';
import { UpdateSearchKeywordDto } from './dto/update-search-keyword-config.dto';

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

    @Get()
    @ApiOperation({ summary: 'Get search keyword configs by domain key' })
    @ApiQuery({
        name: 'domainKey',
        type: String,
        required: true,
        description: 'Domain key to filter search keyword configs',
    })
    async getConfigs(@Query('domainKey') domainKey: string) {
        return this.searchKeywordConfigService.getSearchKeywordConfigs(domainKey);
    }

    @Patch()
    @ApiOperation({ summary: 'Modify' })
    async modifyConfig(@Body() body: UpdateSearchKeywordDto) {
        return this.searchKeywordConfigService.updateSearchKeywordConfigs(
            body.Id,
            body.ConfigurationName,
            body.InputSelector
        )
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete' })
    @ApiParam({
        name: "id",
        type: Number,
        required: true
    })
    async deleteConfig(@Param('id', ParseIntPipe) id: number) {
        return this.searchKeywordConfigService.deleteSearchKeywordConfig(
            id
        )
    }
}
