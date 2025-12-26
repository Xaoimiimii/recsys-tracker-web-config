import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating, User } from 'src/generated/prisma/client';

@Injectable()
export class RatingService {
    constructor(private prisma: PrismaService) { }

    async createBulk(ratings: CreateRatingDto[]) {
        const domain = await this.prisma.domain.findFirst({
            where: { Key: ratings[0].DomainKey }
        });

        if (!domain) {
            throw new Error('Domain not found');
        }

        return await this.prisma.$transaction(async (tx) => {
            const success: { item: CreateRatingDto, rating: Rating }[] = [];
            const failed: { item: CreateRatingDto, reason: string }[] = [];

            for (const rating of ratings) {
                const item = await tx.item.findFirst({
                    where: { DomainItemId: rating.itemId }
                });

                if (!item) {
                    console.warn(`Item not found: ${rating.itemId}`);
                    failed.push({ item: rating, reason: `Item not found: ${rating.itemId}` });
                    continue;
                }

                let user: User | null = null;
                if (rating.username) {
                    user = await tx.user.findFirst({
                        where: { Username: rating.username }
                    });

                    if (user && rating.userId && user.DomainUserId !== rating.userId) {
                        failed.push({
                            item: rating,
                            reason: `User ${rating.userId} not match with username ${rating.username}`
                        });
                        continue;
                    }
                }

                if (!user && rating.userId) {
                    user = await tx.user.findFirst({
                        where: { DomainUserId: rating.userId }
                    });
                }

                if (!user) {
                    user = await tx.user.create({
                        data: {
                            Username: rating.username,
                            DomainUserId: rating.userId,
                            Domain: { connect: { Id: domain.Id } }
                        }
                    });
                }

                const existingRating = await tx.rating.findUnique({
                    where: {
                        UserId_ItemId: {
                            UserId: user.Id,
                            ItemId: item.Id
                        }
                    }
                });

                if (existingRating) {
                    failed.push({ item: rating, reason: 'User already rated this item' });
                    continue;
                }

                const createdRating = await tx.rating.create({
                    data: {
                        Value: rating.rating,
                        ReviewText: rating.review || null,
                        ConvertedScore: rating.rating,
                        User: { connect: { Id: user.Id } },
                        Item: { connect: { Id: item.Id } },
                        Domain: { connect: { Id: domain.Id } }
                    }
                });

                success.push({ item: rating, rating: createdRating });
            }

            return { success, failed };
        });
    }
}
