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
}
