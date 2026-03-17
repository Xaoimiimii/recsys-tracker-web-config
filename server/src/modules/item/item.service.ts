import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

        const BATCH_SIZE = 500; 
        const results: Item[] = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);

            const batchResults = await this.prisma.$transaction(
                async (tx) => {
                    const itemsData = batch.map((item) => ({
                        DomainItemId: item.TernantItemId,
                        Title: item.Title,
                        Description: item.Description || '',
                        EmbeddingVector: [],
                        ModifiedAt: new Date(),
                        DomainId: domain.Id,
                        ImageUrl: item.ImageUrl || null,
                        Attributes: item.Attributes || undefined,
                    }));

                    const createdItems = await tx.item.createManyAndReturn({
                        data: itemsData,
                        skipDuplicates: true,
                    });

                    const itemCategoryData: { ItemId: number; CategoryId: number }[] = [];
                    
                    const createdItemMap = new Map(createdItems.map(item => [item.DomainItemId, item.Id]));

                    for (const item of batch) {
                        const dbItemId = createdItemMap.get(item.TernantItemId);
                        
                        if (dbItemId && item.Categories && item.Categories.length > 0) {
                            const categoryIds = [...new Set(item.Categories
                                .map((catName) => categoryMap.get(catName?.trim()))
                                .filter((id): id is number => id !== undefined)
                            )];

                            categoryIds.forEach((catId) => {
                                itemCategoryData.push({
                                    ItemId: dbItemId,
                                    CategoryId: catId,
                                });
                            });
                        }
                    }

                    if (itemCategoryData.length > 0) {
                        await tx.itemCategory.createMany({
                            data: itemCategoryData,
                            skipDuplicates: true,
                        });
                    }

                    const itemsWithRelations = await tx.item.findMany({
                        where: { Id: { in: createdItems.map(item => item.Id) } },
                        include: {
                            ItemCategories: {
                                include: {
                                    Category: true
                                }
                            }
                        }
                    });

                    return itemsWithRelations;
                },
                {
                    maxWait: 15000,
                    timeout: 100000,
                },
            );

            if (batchResults.length > 0) {
                this.searchService.createItemInBulk(batchResults, domain.Id)
                    .catch(err => this.logger.error("Elasticsearch sync failed", err));
            }

            results.push(...batchResults);
            
            this.logger.log(`Processed ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
        }

        return results;
    }

    // async createBulk(items: CreateItemDto[]) {
    //     const domain = await this.prisma.domain.findFirst({
    //         where: {
    //             Key: items[0].DomainKey,
    //         },
    //     });

    //     if (!domain) {
    //         throw new Error('Domain not found');
    //     }

    //     // Collect all unique category names
    //     const allCategoryNames = new Set<string>();
    //     items.forEach((item) => {
    //         item.Categories?.forEach((cat) => allCategoryNames.add(cat.trim()));
    //     });

    //     // Bulk upsert categories
    //     const categoryMap = new Map<string, number>();
    //     if (allCategoryNames.size > 0) {
    //         // First, get existing categories
    //         const existingCategories = await this.prisma.category.findMany({
    //             where: { Name: { in: Array.from(allCategoryNames) } }
    //         });
            
    //         existingCategories.forEach(cat => {
    //             categoryMap.set(cat.Name, cat.Id);
    //         });

    //         // Create missing categories
    //         const missingCategoryNames = Array.from(allCategoryNames)
    //             .filter(name => !categoryMap.has(name));
            
    //         if (missingCategoryNames.length > 0) {
    //             const newCategories = await this.prisma.category.createManyAndReturn({
    //                 data: missingCategoryNames.map(name => ({ Name: name })),
    //                 skipDuplicates: true,
    //             });
                
    //             newCategories.forEach(cat => {
    //                 categoryMap.set(cat.Name, cat.Id);
    //             });
    //         }
    //     }

    //     const BATCH_SIZE = 100; // Increased from 50
    //     const results: Item[] = [];

    //     for (let i = 0; i < items.length; i += BATCH_SIZE) {
    //         const batch = items.slice(i, i + BATCH_SIZE);

    //         const batchResults = await this.prisma.$transaction(
    //             async (tx) => {
    //                 const itemPromises = batch.map(async (item) => {
    //                     const categoryIds = [
    //                         ...new Set((item.Categories || [])
    //                             .map((catName) => categoryMap.get(catName?.trim()))
    //                             .filter((id): id is number => id !== undefined))
    //                     ];

    //                     return tx.item.create({
    //                         data: {
    //                             DomainItemId: item.TernantItemId,
    //                             Title: item.Title,
    //                             Description: item.Description || '',
    //                             EmbeddingVector: [],
    //                             ModifiedAt: new Date(),
    //                             Domain: {
    //                                 connect: { Id: domain.Id },
    //                             },
    //                             ItemCategories: {
    //                                 create: categoryIds.map((catId) => ({
    //                                     CategoryId: catId,
    //                                 })),
    //                             },
    //                             ImageUrl: item.ImageUrl || null,
    //                             Attributes: item.Attributes || undefined,
    //                         },
    //                         include: {
    //                             ItemCategories: {
    //                                 include: {
    //                                     Category: true
    //                                 }
    //                             }
    //                         }
    //                     });
    //                 });

    //                 return await Promise.all(itemPromises);
    //             },
    //             {
    //                 maxWait: 15000,
    //                 timeout: 100000,
    //             },
    //         );

    //         if (batchResults.length > 0) {
    //             await this.searchService.createItemInBulk(batchResults, domain.Id);
    //         }

    //         results.push(...batchResults);
            
    //         // Log progress
    //         this.logger.log(`Processed ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
    //     }

    //     return results;
    // }

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

        // const BATCH_SIZE = 100; // Increased from 50
        // const results: Item[] = [];

        // for (let i = 0; i < items.length; i += BATCH_SIZE) {
        //     const batch = items.slice(i, i + BATCH_SIZE);

        //     const batchResults = await this.prisma.$transaction(
        //         async (tx) => {
        //             const itemPromises = batch.map(async (item) => {
        //                 const existingItem = await tx.item.findFirst({
        //                     where: {
        //                         DomainItemId: item.TernantItemId,
        //                         DomainId: domain.Id,
        //                     },
        //                 });

        //                 if (!existingItem) {
        //                     throw new Error(`Item with TernantItemId ${item.TernantItemId} not found`);
        //                 }

        //                 const categoryIds = (item.Categories || [])
        //                     .map((catName) => categoryMap.get(catName.trim()))
        //                     .filter((id): id is number => id !== undefined);

        //                 // Delete existing categories if new categories are provided
        //                 if (item.Categories && item.Categories.length > 0) {
        //                     await tx.itemCategory.deleteMany({
        //                         where: { ItemId: existingItem.Id },
        //                     });
        //                 }

        //                 // Build update data with only provided fields
        //                 const updateData: any = {
        //                     ModifiedAt: new Date(),
        //                 };

        //                 // Only update fields that are explicitly provided
        //                 if (item.Title !== undefined && item.Title !== null) {
        //                     updateData.Title = item.Title;
        //                 }
        //                 if (item.Description !== undefined && item.Description !== null) {
        //                     updateData.Description = item.Description;
        //                 }
        //                 if (item.ImageUrl !== undefined && item.ImageUrl !== null) {
        //                     updateData.ImageUrl = item.ImageUrl;
        //                 }
        //                 if (item.Attributes !== undefined) {
        //                     updateData.Attributes = item.Attributes;
        //                 }

        //                 // Add categories if provided
        //                 if (categoryIds.length > 0) {
        //                     updateData.ItemCategories = {
        //                         create: categoryIds.map((catId) => ({
        //                             CategoryId: catId,
        //                         })),
        //                     };
        //                 }

        //                 return tx.item.update({
        //                     where: { Id: existingItem.Id },
        //                     data: updateData,
        //                     include: {
        //                         ItemCategories: {
        //                             include: {
        //                                 Category: true
        //                             }
        //                         }
        //                     }
        //                 });
        //             });

        //             return await Promise.all(itemPromises);
        //         },
        //         {
        //             maxWait: 15000,
        //             timeout: 100000,
        //         },
        //     );

        //     if (batchResults.length > 0) {
        //         await this.searchService.updateItemInBulk(batchResults, domain.Id);
        //     }

        //     results.push(...batchResults);
            
        //     // Log progress
        //     this.logger.log(`Updated ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
        // }

        // return results;
        const BATCH_SIZE = 500; // Tăng batch size lên để tận dụng Bulk Query
        const results: Item[] = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);

            const batchResults = await this.prisma.$transaction(
                async (tx) => {
                    const tenantItemIds = batch.map(item => item.TernantItemId);
                    const existingItems = await tx.item.findMany({
                        where: {
                            DomainId: domain.Id,
                            DomainItemId: { in: tenantItemIds }
                        }
                    });

                    const existingItemMap = new Map(existingItems.map(item => [item.DomainItemId, item]));
                    const existingItemIds = existingItems.map(item => item.Id);

                    if (existingItemIds.length > 0) {
                        await tx.itemCategory.deleteMany({
                            where: { ItemId: { in: existingItemIds } }
                        });
                    }

                    const itemCategoryData: { ItemId: number, CategoryId: number }[] = [];
                    const updatePromises: Promise<any>[] = [];

                    for (const item of batch) {
                        const existingItem = existingItemMap.get(item.TernantItemId);
                        if (!existingItem) {
                            this.logger.warn(`Item with TernantItemId ${item.TernantItemId} not found`);
                            continue;
                        }

                        const updateData: any = { ModifiedAt: new Date() };
                        if (item.Title !== undefined && item.Title !== null) updateData.Title = item.Title;
                        if (item.Description !== undefined && item.Description !== null) updateData.Description = item.Description;
                        if (item.ImageUrl !== undefined && item.ImageUrl !== null) updateData.ImageUrl = item.ImageUrl;
                        if (item.Attributes !== undefined) updateData.Attributes = item.Attributes;

                        updatePromises.push(
                            tx.item.update({
                                where: { Id: existingItem.Id },
                                data: updateData
                            })
                        );

                        if (item.Categories && item.Categories.length > 0) {
                            const categoryIds = [...new Set(item.Categories
                                .map((catName) => categoryMap.get(catName.trim()))
                                .filter((id): id is number => id !== undefined)
                            )];

                            categoryIds.forEach(catId => {
                                itemCategoryData.push({
                                    ItemId: existingItem.Id,
                                    CategoryId: catId
                                });
                            });
                        }
                    }

                    await Promise.all(updatePromises);

                    if (itemCategoryData.length > 0) {
                        await tx.itemCategory.createMany({
                            data: itemCategoryData,
                            skipDuplicates: true
                        });
                    }

                    const updatedItemsWithCategories = await tx.item.findMany({
                        where: { Id: { in: existingItemIds } },
                        include: {
                            ItemCategories: {
                                include: { Category: true }
                            }
                        }
                    });

                    return updatedItemsWithCategories;
                },
                {
                    maxWait: 15000,
                    timeout: 100000,
                },
            );

            if (batchResults.length > 0) {
                // TỐI ƯU ES: Xóa chữ 'await' để chạy nền, API sẽ trả kết quả ngay cho web mà không bị khựng lại
                this.searchService.updateItemInBulk(batchResults, domain.Id)
                    .catch(err => this.logger.error("Elasticsearch sync failed", err));
            }

            results.push(...batchResults);
            
            // Log progress
            this.logger.log(`Updated ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} items`);
        }

        return results;
    }

    async getItemsByDomainKey(
        domainKey: string,
        page = 1,
        pageSize = 200,
    ) {
        if (!domainKey) throw new BadRequestException('Domain key can not be empty!');

        const safePage = Math.max(page, 1);
        const safePageSize = Math.min(Math.max(pageSize, 1), 1000);

        return await this.prisma.item.findMany({
            where: {
                Domain: {
                    Key: domainKey
                }
            },
            skip: (safePage - 1) * safePageSize,
            take: safePageSize,
            orderBy: {
                ModifiedAt: 'asc',
            },
            select: {
                Id: true,
                DomainItemId: true,
                Title: true,
                DomainId: true,
                Description: true,
                ModifiedAt: true,
                ImageUrl: true,
                Attributes: true,
            },
        });
    }

    async deleteItemsByDomainKey(domainKey: string, domainItemIds: string[]) {
        if (!domainKey) {
            throw new BadRequestException('Domain key can not be empty!');
        }

        const uniqueDomainItemIds = [...new Set((domainItemIds || []).map((id) => id?.trim()).filter(Boolean))];
        if (uniqueDomainItemIds.length === 0) {
            throw new BadRequestException('Domain item ids can not be empty!');
        }

        const domain = await this.prisma.domain.findUnique({
            where: { Key: domainKey },
            select: { Id: true },
        });

        if (!domain) {
            throw new BadRequestException('Domain not found');
        }

        const existingItems = await this.prisma.item.findMany({
            where: {
                DomainId: domain.Id,
                DomainItemId: { in: uniqueDomainItemIds },
            },
            select: {
                Id: true,
                DomainItemId: true,
            },
        });

        if (existingItems.length === 0) {
            return {
                requestedCount: uniqueDomainItemIds.length,
                deletedCount: 0,
                deletedDomainItemIds: [],
                notFoundDomainItemIds: uniqueDomainItemIds,
            };
        }

        const itemIds = existingItems.map((item) => item.Id);
        const deletedDomainItemIds = existingItems
            .map((item) => item.DomainItemId)
            .filter((id): id is string => !!id);
        const deletedDomainItemIdSet = new Set(deletedDomainItemIds);
        const notFoundDomainItemIds = uniqueDomainItemIds.filter((id) => !deletedDomainItemIdSet.has(id));

        await Promise.all([
            this.prisma.itemCategory.deleteMany({ where: { ItemId: { in: itemIds } } }),
            this.prisma.itemFactor.deleteMany({ where: { ItemId: { in: itemIds } } }),
            this.prisma.predict.deleteMany({ where: { ItemId: { in: itemIds } } }),
            this.prisma.rating.deleteMany({ where: { ItemId: { in: itemIds } } }),
            this.prisma.interaction.deleteMany({ where: { ItemId: { in: itemIds } } }),
        ]);

        const deletedItems = await this.prisma.item.deleteMany({
            where: {
                Id: { in: itemIds },
                DomainId: domain.Id,
            },
        });

        if (deletedItems.count > 0) {
            this.searchService.deleteItemsInBulk(itemIds, domain.Id)
                .catch((err) => this.logger.error('Elasticsearch delete sync failed', err));
        }

        return {
            requestedCount: uniqueDomainItemIds.length,
            deletedCount: deletedItems.count,
            deletedDomainItemIds,
            notFoundDomainItemIds,
        };
    }
}
