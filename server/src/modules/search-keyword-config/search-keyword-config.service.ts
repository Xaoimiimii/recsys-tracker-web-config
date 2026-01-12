import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchKeywordConfigService {
    constructor(private readonly prisma: PrismaService) { }

    async createSearchKeywordConfig(domainKey: string, configName: string, inputSelector: string) {
        const domain = await this.prisma.domain.findUnique({
            where: { Key: domainKey },
        });

        if (!domain) throw new BadRequestException('Domain not found');

        const newConfig = await this.prisma.searchKeywordConfig.create({
            data: {
                DomainID: domain.Id,
                ConfigurationName: configName,
                InputSelector: inputSelector,
            },
        });
        return newConfig;
    }
}
