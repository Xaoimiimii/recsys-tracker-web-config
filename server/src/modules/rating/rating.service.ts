import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from 'src/generated/prisma/client';

@Injectable()
export class RatingService {
    constructor(private prisma: PrismaService) {}

    async createBulk(ratings: CreateRatingDto[]) {
        const domain = await this.prisma.domain.findFirst({
            where: { Key: ratings[0].DomainKey },
        });

        if (!domain) {
            throw new Error('Domain not found');
        }

        const domainItemIds = [...new Set(ratings.map((r) => r.itemId))];

        const items = await this.prisma.item.findMany({
            where: {
                DomainItemId: { in: domainItemIds },
            },
        });

        const itemMap = new Map(items.map((i) => [i.DomainItemId!, i]));

        const userIds = [...new Set(ratings.map((r) => r.userId))];

        const users = await this.prisma.user.findMany({
            where: { UserId: { in: userIds } },
        });

        const userMap = new Map(users.map((u) => [u.UserId, u]));

        return await this.prisma.$transaction(async (tx) => {
            // First, create all missing users
            const missingUserIds = ratings
                .map(r => r.userId)
                .filter(userId => !userMap.has(userId));
            
            const uniqueMissingUserIds = [...new Set(missingUserIds)];
            
            if (uniqueMissingUserIds.length > 0) {
                const newUsers = await tx.user.createManyAndReturn({
                    data: uniqueMissingUserIds.map(userId => ({
                        UserId: userId,
                        DomainId: domain.Id,
                    })),
                });
                
                newUsers.forEach(user => {
                    userMap.set(user.UserId, user);
                });
            }

            // Now create all ratings at once
            const ratingsToCreate = ratings
                .filter(rating => {
                    const item = itemMap.get(rating.itemId);
                    if (!item) {
                        console.warn(`Item not found: ${rating.itemId}`);
                        return false;
                    }
                    return true;
                })
                .map(rating => {
                    const item = itemMap.get(rating.itemId)!;
                    const user = userMap.get(rating.userId)!;
                    
                    return {
                        Value: rating.rating,
                        ReviewText: rating.review || null,
                        ConvertedScore: rating.rating,
                        UserId: user.Id,
                        ItemId: item.Id,
                        DomainId: domain.Id,
                    };
                });

            if (ratingsToCreate.length === 0) {
                return [];
            }

            const results = await tx.rating.createManyAndReturn({
                data: ratingsToCreate,
            });

            return results;
        }, {
            maxWait: 10000, // 10 seconds
            timeout: 15000, // 15 seconds
        });
    }
}
