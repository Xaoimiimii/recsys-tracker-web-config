import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationService {
    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
    ) { }

    async triggerTrainModels() {
        const url =
            process.env.MODEL_URL
                ? `${process.env.MODEL_URL}/api/train`
                : 'http://localhost:8000/api/train';

        const allDomains = await this.prisma.domain.findMany();

        for (const domain of allDomains) {
            const response = await firstValueFrom(
                this.httpService.post(url, {
                    domain_id: domain.Id,
                }),
            );
        }
    }

    async getRecommendations(userId: number, numberItems: number = 10) {
        const items = await this.prisma.predict.findMany({
            where: {
                UserId: userId,
            },
            orderBy: {
                Value: 'desc',
            },
        });

        const ratedItems = await this.prisma.rating.findMany({
            where: {
                UserId: userId,
            },
        });

        const ratedItemsIds = ratedItems.map((item) => item.ItemId);

        const recommendations = items.filter((item) => !ratedItemsIds.includes(item.ItemId));

        return recommendations.slice(0, numberItems);
    }
}