import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventService {
    constructor(private prismaService: PrismaService) {

    }

    async getKEventsByDomainKey(key: string, k: number, page: number, ruleId?: number) {
        if (k <= 0) throw new BadRequestException('K must be greater than 0');

        const domain = await this.prismaService.domain.findUnique({
            where: {
                Key: key
            }
        });

        if (!domain) throw new NotFoundException('Domain not found');
        return this.prismaService.event.findMany({
            where: {
                TrackingRule: {
                    DomainID: domain.Id,
                    ...(ruleId && { Id: ruleId })
                }
            },
            orderBy: {
                Timestamp: 'desc'
            },
            skip: (page - 1) * k,
            take: k,
            select: {
                Id: true,
                EventTypeId: true,
                UserId: true,
                ItemId: true,
                AnonymousId: true,
                RatingValue: true,
                ReviewValue: true,
                Timestamp: true,
                TrackingRule: {
                    select: {
                        Id: true,
                        Name: true,
                        ActionType: true
                    }
                }
            }
        });
    }

    async getKEventsByTrackingRuleId(trackingRuleId: number, k: number, page: number) {
        if (k <= 0) throw new BadRequestException('K must be greater than 0');

        return this.prismaService.event.findMany({
            where: {
                TrackingRuleId: trackingRuleId
            },
            orderBy: {
                Timestamp: 'desc'
            },
            skip: (page - 1) * k,
            take: k,
            select: {
                Id: true,
                EventTypeId: true,
                UserId: true,
                ItemId: true,
                AnonymousId: true,
                RatingValue: true,
                ReviewValue: true,
                Timestamp: true,
                TrackingRule: {
                    select: {
                        Id: true,
                        Name: true,
                        ActionType: true
                    }
                }
            }
        });
    }
}
