import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Item } from 'src/generated/prisma/client';
import { Logger } from '@nestjs/common';

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);
    private readonly INDEX_NAME = 'items';
    constructor(private readonly elasticsearchService: ElasticsearchService) { }

    async search(domainId: number, title: string, description: string) {
        const result = await this.elasticsearchService.search({
            index: this.INDEX_NAME,
            query: {
                match: {
                    title: title,
                    description: description,
                    domainId: domainId
                }
            }
        });

        return result.hits.hits;
    }

    async createBulk(items: Item[]) {
        try {

        } catch (error) {

        }
    }
}
