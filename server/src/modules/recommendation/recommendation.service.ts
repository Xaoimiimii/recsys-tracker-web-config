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

    triggerTrainModels(
        domainId?: number | string,
        epochs: number | string = 500,
        plaEpochs: number | string = 500,
        batchSize: number | string = 256,
        tolerance: number | string = 0.000001,
        saveAfterTrain: boolean = true,
        trainSubmodels: boolean = true,
    ): Observable<{ progress: number; message: string }> {
        const url =
            process.env.MODEL_URL
                ? `${process.env.MODEL_URL}/api/train`
                : 'http://127.0.0.1:8000/api/train';

        return new Observable((subscriber) => {
            (async () => {
                try {
                    let domainsToTrain: any[] = [];

                    if (domainId) {
                        const domain = await this.prisma.domain.findUnique({
                            where: { Id: Number(domainId) },
                        });
                        if (domain) {
                            domainsToTrain = [domain];
                        }
                    } else {
                        domainsToTrain = await this.prisma.domain.findMany();
                    }

                    const total = domainsToTrain.length;
                    let processed = 0;

                    if (total === 0) {
                        subscriber.next({ progress: 100, message: 'No domains to train.' });
                        subscriber.complete();
                        return;
                    }

                    subscriber.next({ progress: 0, message: 'Sending train request...' });

                    for (const domain of domainsToTrain) {
                        let message = '';
                        try {
                            const payload = {
                                domain_id: domain.Id,
                                epochs: Number(epochs),
                                pla_epochs: Number(plaEpochs),
                                batch_size: Number(batchSize),
                                tolerance: Number(tolerance),
                                save_after_train: saveAfterTrain,
                                train_submodels: trainSubmodels,
                            };

                            await firstValueFrom(
                                this.httpService.post(url, payload),
                            );

                            message = `Domain ${domain.Id} train request sent successfully`;
                        } catch (error) {
                            message = `Domain ${domain.Id} train request sent failed`;
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