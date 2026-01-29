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

    async getSearchKeywordConfigs(domainKey: string) {
        const domain = await this.prisma.domain.findUnique({
            where: { Key: domainKey },
        });
        if (!domain) throw new BadRequestException('Domain not found');
        
        const configs = await this.prisma.searchKeywordConfig.findMany({
            where: { DomainID: domain.Id },
        });

        return configs;
    }

    async updateSearchKeywordConfigs(
        id: number,
        configurationName?: string,
        inputSelector?: string
    ) {
        const config = await this.prisma.searchKeywordConfig.findUnique({
            where: {
                Id: id
            }
        });

        if (!config) throw new BadRequestException(`Search keyword config with id ${id} does not exist`);

        const newConfig = await this.prisma.searchKeywordConfig.update({
            where: {
                Id: id
            },
            data: {
                ConfigurationName: configurationName,
                InputSelector: inputSelector
            }
        })

        return newConfig;
    }

    async deleteSearchKeywordConfig(id: number) {
        const config = await this.prisma.searchKeywordConfig.findUnique({
            where: {
                Id: id
            }
        });

        if (!config) throw new BadRequestException(`Search keyword config with id ${id} does not exist`);
        await this.prisma.searchKeywordConfig.delete({
            where: {
                Id: id
            }
        });
    }
}
