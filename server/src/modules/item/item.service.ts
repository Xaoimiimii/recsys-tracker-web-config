import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-items.dto';
import { Item } from 'src/generated/prisma/client';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchService } from '../search/search.service';

@Injectable()
export class ItemService {
    private readonly logger = new Logger(ItemService.name);
    private readonly INDEX_NAME = 'items';

    constructor(
        private readonly prisma: PrismaService,
        private readonly searchService: SearchService,
    ) {}

    async createBulk(items: CreateItemDto[]) {
        const domain = await this.prisma.domain.findFirst({
            where: {
                Key: items[0].DomainKey,
            },
        });

        if (!domain) {
            throw new Error('Domain not found');
        }

        const allCategoryNames = new Set<string>();
        items.forEach((item) => {
            item.Categories?.forEach((cat) => allCategoryNames.add(cat.trim()));
        });

        const categoryMap = new Map<string, number>();
        for (const catName of allCategoryNames) {
            const category = await this.prisma.category.upsert({
                where: { Name: catName },
                create: { Name: catName },
                update: {},
            });
            categoryMap.set(catName, category.Id);
        }

        const BATCH_SIZE = 50;
        const results: Item[] = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);

            const batchResults = await this.prisma.$transaction(
                async (tx) => {
                    const itemPromises = batch.map(async (item) => {
                        const categoryIds = (item.Categories || [])
                            .map((catName) => categoryMap.get(catName.trim()))
                            .filter((id): id is number => id !== undefined);

                        return tx.item.create({
                            data: {
                                DomainItemId: item.TernantItemId,
                                Title: item.Title,
                                Description: item.Description || '',
                                EmbeddingVector: [],
                                ModifiedAt: new Date(),
                                Domain: {
                                    connect: { Id: domain.Id },
                                },
                                ItemCategories: {
                                    create: categoryIds.map((catId) => ({
                                        CategoryId: catId,
                                    })),
                                },
                                ImageUrl: item.ImageUrl || null,
                                Attributes: item.Attributes || undefined,
                            },
                        });
                    });

                    return await Promise.all(itemPromises);
                },
                {
                    maxWait: 10000,
                    timeout: 30000,
                },
            );

            if (batchResults.length > 0) {
                await this.searchService.createItemInBulk(batchResults, domain.Id);
            }

            results.push(...batchResults);
        }

        return results;
    }

}
