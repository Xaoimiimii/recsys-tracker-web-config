import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-items.dto';
import { Item } from 'src/generated/prisma/client';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchService } from '../search/search.service';
import { UpdateItemDto } from './dto/update-item.dto';

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

        // Collect all unique category names
        const allCategoryNames = new Set<string>();
        items.forEach((item) => {
            item.Categories?.forEach((cat) => allCategoryNames.add(cat.trim()));
        });

        // Bulk upsert categories
        const categoryMap = new Map<string, number>();
        if (allCategoryNames.size > 0) {
            // First, get existing categories
            const existingCategories = await this.prisma.category.findMany({
                where: { Name: { in: Array.from(allCategoryNames) } }
            });
            
            existingCategories.forEach(cat => {
                categoryMap.set(cat.Name, cat.Id);
            });

            // Create missing categories
            const missingCategoryNames = Array.from(allCategoryNames)
                .filter(name => !categoryMap.has(name));
            
            if (missingCategoryNames.length > 0) {
                const newCategories = await this.prisma.category.createManyAndReturn({
                    data: missingCategoryNames.map(name => ({ Name: name })),
                    skipDuplicates: true,
                });
                
                newCategories.forEach(cat => {
                    categoryMap.set(cat.Name, cat.Id);
                });
            }
        }

        const BATCH_SIZE = 100; // Increased from 50
        const results: Item[] = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);

            const batchResults = await this.prisma.$transaction(
                async (tx) => {
                    const itemPromises = batch.map(async (item) => {
                        const categoryIds = [
                            ...new Set((item.Categories || [])
                                .map((catName) => categoryMap.get(catName?.trim()))
                                .filter((id): id is number => id !== undefined))
                        ];

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
                            include: {
                                ItemCategories: {
                                    include: {
                                        Category: true
                                    }
                                }
                            }
                        });
                    });

                    return await Promise.all(itemPromises);
                },
                {
                    maxWait: 15000, // Increased from 10s
                    timeout: 45000, // Increased from 30s
                },
            );

            if (batchResults.length > 0) {
                await this.searchService.createItemInBulk(batchResults, domain.Id);
            }

            results.push(...batchResults);
            
            // Log progress
            this.logger.log(`Processed ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
        }

        return results;
    }

    async updateBulk(items: UpdateItemDto[]) {
        const domain = await this.prisma.domain.findUnique({
            where: {
                Key: items[0].DomainKey
            }
        });

        if (!domain) {
            throw new Error('Domain not found');
        }

        // Collect all unique category names
        const allCategoryNames = new Set<string>();
        items.forEach((item) => {
            item.Categories?.forEach((cat) => allCategoryNames.add(cat.trim()));
        });

        // Bulk upsert categories
        const categoryMap = new Map<string, number>();
        if (allCategoryNames.size > 0) {
            // First, get existing categories
            const existingCategories = await this.prisma.category.findMany({
                where: { Name: { in: Array.from(allCategoryNames) } }
            });
            
            existingCategories.forEach(cat => {
                categoryMap.set(cat.Name, cat.Id);
            });

            // Create missing categories
            const missingCategoryNames = Array.from(allCategoryNames)
                .filter(name => !categoryMap.has(name));
            
            if (missingCategoryNames.length > 0) {
                const newCategories = await this.prisma.category.createManyAndReturn({
                    data: missingCategoryNames.map(name => ({ Name: name })),
                    skipDuplicates: true,
                });
                
                newCategories.forEach(cat => {
                    categoryMap.set(cat.Name, cat.Id);
                });
            }
        }

        const BATCH_SIZE = 100; // Increased from 50
        const results: Item[] = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);

            const batchResults = await this.prisma.$transaction(
                async (tx) => {
                    const itemPromises = batch.map(async (item) => {
                        const existingItem = await tx.item.findFirst({
                            where: {
                                DomainItemId: item.TernantItemId,
                                DomainId: domain.Id,
                            },
                        });

                        if (!existingItem) {
                            throw new Error(`Item with TernantItemId ${item.TernantItemId} not found`);
                        }

                        const categoryIds = (item.Categories || [])
                            .map((catName) => categoryMap.get(catName.trim()))
                            .filter((id): id is number => id !== undefined);

                        // Delete existing categories if new categories are provided
                        if (item.Categories && item.Categories.length > 0) {
                            await tx.itemCategory.deleteMany({
                                where: { ItemId: existingItem.Id },
                            });
                        }

                        return tx.item.update({
                            where: { Id: existingItem.Id },
                            data: {
                                Title: item.Title,
                                Description: item.Description || '',
                                ModifiedAt: new Date(),
                                ItemCategories: categoryIds.length > 0 ? {
                                    create: categoryIds.map((catId) => ({
                                        CategoryId: catId,
                                    })),
                                } : undefined,
                                ImageUrl: item.ImageUrl || null,
                                Attributes: item.Attributes || undefined,
                            },
                            include: {
                                ItemCategories: {
                                    include: {
                                        Category: true
                                    }
                                }
                            }
                        });
                    });

                    return await Promise.all(itemPromises);
                },
                {
                    maxWait: 15000, // Increased from 10s
                    timeout: 45000, // Increased from 30s
                },
            );

            if (batchResults.length > 0) {
                await this.searchService.updateItemInBulk(batchResults, domain.Id);
            }

            results.push(...batchResults);
            
            // Log progress
            this.logger.log(`Updated ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
        }

        return results;
    }
}
