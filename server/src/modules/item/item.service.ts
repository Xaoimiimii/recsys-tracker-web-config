import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-items.dto';
import { Item } from 'src/generated/prisma/client';

@Injectable()
export class ItemService {
    constructor(private prisma: PrismaService) { }
    
    async createBulk(items: CreateItemDto[]) {
        const domain = await this.prisma.domain.findFirst({
            where: {
                Key: items[0].DomainKey
            }
        });

        if (!domain) {
            throw new Error('Domain not found');
        }

        return await this.prisma.$transaction(async (tx) => {
            const results: Item[] = [];

            for (const item of items) {
                const categoryIds: number[] = [];
                
                if (item.Categories && item.Categories.length > 0) {
                    for (const catName of item.Categories) {
                        const trimmedName = catName.trim();
                        
                        let category = await tx.category.findFirst({
                            where: { Name: trimmedName }
                        });

                        if (!category) {
                            category = await tx.category.create({
                                data: { Name: trimmedName }
                            });
                        }
                        
                        if (category) categoryIds.push(category.Id);
                    }
                }

                const createdItem = await tx.item.create({
                    data: {
                        DomainItemId: item.TernantItemId,
                        Title: item.Title,
                        Description: item.Description || '',
                        EmbeddingVector: [],
                        ModifiedAt: new Date(),
                        
                        Domain: {
                            connect: { Id: domain.Id }
                        },

                        ItemCategories: {
                            create: categoryIds.map(catId => ({
                                Category: {
                                    connect: { Id: catId }
                                }
                            }))
                        },
                    }
                });
                results.push(createdItem);
            }
            return results;
        });
    }
}