import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationService {
    private readonly logger = new Logger(RecommendationService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
    ) { }

    triggerTrainModels(): Observable<{ progress: number; message: string }> {
        const url =
            process.env.MODEL_URL
                ? `${process.env.MODEL_URL}/api/train`
                : 'http://localhost:8000/api/train';

        return new Observable((subscriber) => {
            (async () => {
                try {
                    const allDomains = await this.prisma.domain.findMany();
                    const total = allDomains.length;
                    let processed = 0;

                    if (total === 0) {
                        subscriber.next({ progress: 100, message: 'No domains to train.' });
                        subscriber.complete();
                        return;
                    }

                    subscriber.next({ progress: 0, message: 'Starting training...' });

                    for (const domain of allDomains) {
                        let message = '';
                        try {
                            /*
                            const response = await firstValueFrom(
                                this.httpService.post(url, {
                                    domain_id: domain.Id,
                                }),
                            );
                            */
                            // Mocking the request for now as the user mentioned "Cannot find name 'domain'" earlier implies execution issues, 
                            // but I should keep the original logic if possible.
                            // Actually the user fixed the 'domain' issue in previous turn.
                            // Let's use the actual request but strict error handling.

                            await firstValueFrom(
                                this.httpService.post(url, {
                                    domain_id: domain.Id,
                                }),
                            );

                            message = `Domain ${domain.Id} train success`;
                        } catch (error) {
                            message = `Domain ${domain.Id} train failed`;
                            this.logger.error(message, error);
                        } finally {
                            processed++;
                            const progress = Math.round((processed / total) * 100);
                            subscriber.next({
                                progress,
                                message
                            });
                        }
                    }

                    subscriber.complete();
                } catch (err) {
                    subscriber.error(err);
                }
            })();
        });
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