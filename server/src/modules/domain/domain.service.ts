import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { UserIdentityDto } from './dto';
import { Prisma, UserIdentityField, UserIdentitySource } from 'src/generated/prisma/client';

@Injectable()
export class DomainService {
    constructor(private prisma: PrismaService) { }

    async generateApiKey(): Promise<string> {
        while (true) {
            const apiKey = randomBytes(32).toString('hex');
            const existing = await this.prisma.domain.findUnique({
                where: {
                    Key: apiKey
                }
            });
            if (!existing) return apiKey;
        }
    }

    async createDomain(ternantId: number, url: string, Type: number, userIdentity: UserIdentityDto) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

        if (!this.prisma.ternant.findUnique({
            where: {
                Id: ternantId
            }
        })) throw new NotFoundException(`Ternant id '${ternantId}' does not exist.`);

        const apiKey = await this.generateApiKey();

        const domain = await this.prisma.domain.create({
            data: {
                TernantID: ternantId,
                Key: apiKey,
                Type: Type,
                Url: url,
                CreatedAt: new Date()
            }
        });

        await this.prisma.userIdentity.create({
            data: {
                Source: userIdentity.Source,
                DomainId: domain.Id,
                RequestConfig: userIdentity.RequestConfig as Prisma.InputJsonValue,
                Value: userIdentity.Value,
                Field: userIdentity.Field
            }
        })

        return domain;
    }

    async getDomainsByTernantId(ternantId: number) {
        const ternant = await this.prisma.ternant.findUnique({
            where: {
                Id: ternantId
            }
        });

        if (!ternant) throw new NotFoundException('Ternant not found');

        const domains = await this.prisma.domain.findMany({
            where: {
                TernantID: ternantId
            },
            include: {
                UserIdentities: true
            }
        });
        return domains;
    }

    async getUserIdentity(domainKey: string) {
        const domain = await this.prisma.domain.findUnique({
            where: {
                Key: domainKey
            }
        });

        if (!domain) throw new NotFoundException(`Key ${domainKey} not found`);

        const userIdentity = await this.prisma.userIdentity.findFirst({
            where: {
                DomainId: domain.Id
            }
        });

        return userIdentity;
    }

    async updateUserIdentity(
        Id: number,
        Source?: UserIdentitySource,
        RequestConfig?: Object,
        Value?: string,
        Field?: UserIdentityField
    ) {
        return await this.prisma.userIdentity.update({
            where: {
                Id: Id
            },
            data: {
                Source: Source,
                RequestConfig: RequestConfig as Prisma.InputJsonValue,
                Value: Value,
                Field: Field
            }
        })
    }

    async createUserIdentity(
        domainKey: string,
        Source: UserIdentitySource,
        Field: UserIdentityField,
        RequestConfig?: Object,
        Value?: string,
    ) {
        const domain = await this.prisma.domain.findUnique({
            where: {
                Key: domainKey
            }
        });

        if (!domain) throw new NotFoundException(`Domain with key ${domainKey} does not exist`);
        
        return await this.prisma.userIdentity.create({
            data: {
                DomainId: domain.Id,
                Source: Source,
                Field: Field,
                RequestConfig: RequestConfig as Prisma.InputJsonValue,
                Value: Value
            }
        })
    }
}
