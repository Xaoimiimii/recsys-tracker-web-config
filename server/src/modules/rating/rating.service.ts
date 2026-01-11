import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from 'src/generated/prisma/client';

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
            const results: Rating[] = [];;

            for (const rating of ratings) {
                const item = await tx.item.findFirst({
                    where: { DomainItemId: rating.itemId }
                });

                if (!item) {
                    console.warn(`Item not found: ${rating.itemId}`);
                    continue;
                }

                let user = await tx.user.findFirst({
                    where: { UserId: rating.userId }
                });

                if (!user) {
                    user = await tx.user.create({
                        data: {
                            UserId: rating.userId,
                            Domain: { connect: { Id: domain.Id } }
                        }
                    });
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

                results.push(createdRating);
            }

            return results;
        });
    }
}
