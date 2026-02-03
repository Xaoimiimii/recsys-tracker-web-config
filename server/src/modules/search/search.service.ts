import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Item, Prisma } from 'src/generated/prisma/client';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ItemWithCategories = Prisma.ItemGetPayload<{
  include: {
    ItemCategories: {
      include: { Category: true }
    }
  }
}>;

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);
    private readonly INDEX_NAME = 'items';
    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        private readonly prisma: PrismaService
    ) { }

    async search(domainId: number, keyword: string) {
        const result = await this.elasticsearchService.search({
            index: this.INDEX_NAME,
            query: {
                bool: {
                    filter: [
                        { term: { domainId: domainId } }
                    ],
                    must: [
                        {
                            multi_match: {
                                query: keyword,
                                fields: ['title^3', 'description'], 
                                operator: 'or', 
                                fuzziness: 'AUTO', 
                            },
                        },
                    ],
                },
            },
        });

        return {
            items: result.hits.hits.map((hit) => hit._source),
            total: result.hits.total,
        };
    }

    // Debug: Get document by ID to check its content
    async getDocumentById(domainId: number, itemId: number) {
        try {
            const docId = `${domainId}_${itemId}`;
            const result = await this.elasticsearchService.get({
                index: this.INDEX_NAME,
                id: docId,
            });
            return result;
        } catch (error) {
            this.logger.error(`Document ${domainId}_${itemId} not found: ${error.message}`);
            return null;
        }
    }

    // Debug: Count documents by domainId
    async countByDomainId(domainId: number) {
        const result = await this.elasticsearchService.count({
            index: this.INDEX_NAME,
            query: {
                term: { domainId: domainId }
            }
        });
        return result.count;
    }

    async createItemInBulk(items: ItemWithCategories[], domainId: number) {
        try {
            const operations = items.flatMap((item: any) => {
            const categoryNames = item.ItemCategories?.map(
                (ic: any) => ic.Category?.Name
            ).filter((name: string) => name) || [];

            const categoryIds = item.ItemCategories?.map(
                (ic: any) => ic.CategoryId
            ) || [];

            return [
                {
                    index: { _index: this.INDEX_NAME, _id: `${domainId}_${item.Id}` },
                },
                {
                    id: item.Id,
                    domainId: domainId,
                    title: item.Title,
                    description: item.Description,
                    category_names: categoryNames, 
                    category_ids: categoryIds 
                },
            ];
        });

            const bulkResponse = await this.elasticsearchService.bulk({
                operations: operations,
            });

            if (bulkResponse.errors) {
                const erroredItems: any[] = [];

                bulkResponse.items.forEach((action: any, i) => {
                    const operation = Object.keys(action)[0];

                    if (action[operation].error) {
                        erroredItems.push({
                            status: action[operation].status,
                            error: action[operation].error,
                            itemId: items[i].Id,
                        });
                    }
                });

                this.logger.error(`Bulk index errors: ${JSON.stringify(erroredItems)}`,);
            } else {
                this.logger.log(`Indexed ${items.length} items to Elastic successfully.`,);
            }
        } catch (error) {
            this.logger.error(`Failed to bulk index: ${error.message}`);
        }
    }

    async updateItemInBulk(items: ItemWithCategories[], domainId: number) {
        try {
            this.logger.log(`updateItemInBulk called with ${items.length} items for domainId: ${domainId}`);
            
            if (items.length === 0) {
                this.logger.warn('No items to update in Elasticsearch');
                return;
            }

            // const firstItemId = items[0].Id;
            // const existingDoc = await this.getDocumentById(domainId, firstItemId);
            // if (existingDoc) {
            //     this.logger.log(`Existing document for item ${domainId}_${firstItemId}: ${JSON.stringify(existingDoc._source)}`);
            // } else {
            //     this.logger.log(`Document for item ${domainId}_${firstItemId} does NOT exist in ES`);
            // }

            const operations = items.flatMap((item: any) => {
                const categoryNames = item.ItemCategories?.map(
                    (ic: any) => ic.Category?.Name
                ).filter((name: string) => name) || [];

                const categoryIds = item.ItemCategories?.map(
                    (ic: any) => ic.CategoryId
                ) || [];

                return [
                    {
                        update: { _index: this.INDEX_NAME, _id: `${domainId}_${item.Id}` },
                    },
                    {
                        doc: {
                            id: item.Id,
                            domainId: domainId,
                            title: item.Title,
                            description: item.Description,
                            category_names: categoryNames, 
                            category_ids: categoryIds 
                        },
                        doc_as_upsert: true
                    },
                ];
            });

            this.logger.log(`Generated ${operations.length / 2} bulk operations`);

            const bulkResponse = await this.elasticsearchService.bulk({
                operations: operations,
            });

            // // Debug: Log first item response to understand structure
            // if (bulkResponse.items && bulkResponse.items.length > 0) {
            //     this.logger.log(`First bulk item response: ${JSON.stringify(bulkResponse.items[0])}`);
            // }
            // this.logger.log(`Bulk response - took: ${bulkResponse.took}ms, errors: ${bulkResponse.errors}, items count: ${bulkResponse.items?.length || 0}`);

            if (bulkResponse.errors) {
                const erroredItems: any[] = [];
                let createdCount = 0;
                let updatedCount = 0;

                bulkResponse.items.forEach((action: any, i) => {
                    const operation = Object.keys(action)[0];
                    const result = action[operation];

                    if (result.error) {
                        erroredItems.push({
                            status: result.status,
                            error: result.error,
                            itemId: items[i].Id,
                        });
                    } else {
                        // Track created vs updated
                        if (result.result === 'created') {
                            createdCount++;
                        } else if (result.result === 'updated') {
                            updatedCount++;
                        }
                    }
                });

                this.logger.error(`Bulk update errors: ${JSON.stringify(erroredItems)}`);
                this.logger.log(`Partial success - Created: ${createdCount}, Updated: ${updatedCount}, Failed: ${erroredItems.length}`);
                throw new Error(`Failed to update ${erroredItems.length} items in Elasticsearch`);
            } else {
                let createdCount = 0;
                let updatedCount = 0;
                let noopCount = 0;
                
                bulkResponse.items.forEach((action: any) => {
                    const operation = Object.keys(action)[0];
                    const result = action[operation];
                    if (result.result === 'created') {
                        createdCount++;
                    } else if (result.result === 'updated') {
                        updatedCount++;
                    } else if (result.result === 'noop') {
                        noopCount++;
                    }
                });
                
                this.logger.log(`Bulk operation completed - Created: ${createdCount}, Updated: ${updatedCount}, Unchanged (noop): ${noopCount}`);
            }
        } catch (error) {
            this.logger.error(`Failed to bulk update: ${error.message}`);
            throw error;
        }
    }

    async syncItemsFromDatabase(domainId: number) {
        try {
            this.logger.log(`Starting sync elastic search for domain: ${domainId}`);
            const items = await this.prisma.item.findMany({
                where: {
                    DomainId: domainId
                },
                include: {
                    ItemCategories: {
                        include: {
                            Category: true
                        }
                    }
                }
            });

            if (items.length === 0) {
                this.logger.log(`No items found to sync for domain: ${domainId}`);
                return;
            }

            await this.createItemInBulk(items, domainId);
            this.logger.log(`Sync ${items.length} items to Elastic Search`);
            return;
        } catch (error) {
            this.logger.error(`Failed to sync items for domain: ${domainId}. Error: ${error.message}`);
            throw error;
        }
    }
}
