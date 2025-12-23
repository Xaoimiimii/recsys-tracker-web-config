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
                            create: item.Categories?.map(catName => ({
                                Category: {
                                    connectOrCreate: {
                                        where: { Name: catName.trim() },
                                        create: { Name: catName.trim() }
                                    }
                                }
                            })) ?? []
                        },
                    }
                });

                results.push(createdItem);
            }

            return results;
        });
    }

}