import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventService {
    constructor(private prismaService: PrismaService) {

    }

    private resolveInteractionTypeLabel(eventTypeId: number, actionType: ActionType | null) {
        if (eventTypeId === 2) return 'Rating';
        if (eventTypeId === 3) return 'Review';
        if (eventTypeId === 1) return actionType ?? 'UnknownActionType';
        return `EventType:${eventTypeId}`;
    }

    async countActiveUsersByDomainKeyAndMinutes(key: string, minutes: number) {
        if (minutes <= 0) throw new BadRequestException('minutes must be greater than 0');

        const domain = await this.prismaService.domain.findUnique({
            where: {
                Key: key,
            },
        });

        if (!domain) throw new NotFoundException('Domain not found');

        const fromDate = new Date(Date.now() - minutes * 60 * 1000);
        const vnTime = fromDate.toLocaleString('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh'
        });

        const result = await this.prismaService.$queryRaw<{
            active_user_count: bigint;
            authenticated_user_count: bigint;
            anonymous_user_count: bigint;
        }[]>`
            SELECT
                COUNT(DISTINCT e."UserId") FILTER (WHERE e."UserId" IS NOT NULL)
                + COUNT(DISTINCT e."AnonymousId") FILTER (WHERE e."UserId" IS NULL AND e."AnonymousId" IS NOT NULL)
                AS active_user_count,
                COUNT(DISTINCT e."UserId") FILTER (WHERE e."UserId" IS NOT NULL) AS authenticated_user_count,
                COUNT(DISTINCT e."AnonymousId") FILTER (WHERE e."UserId" IS NULL AND e."AnonymousId" IS NOT NULL) AS anonymous_user_count
            FROM "Event" e
                INNER JOIN "TrackingRule" tr ON tr."Id" = e."TrackingRuleId"
            WHERE tr."DomainID" = ${domain.Id}
              AND e."Timestamp" >= ${vnTime}
              AND (e."UserId" IS NOT NULL OR e."AnonymousId" IS NOT NULL)
        `;

        const counts = result[0];

        return {
            domainKey: key,
            minutes,
            from: fromDate,
            to: new Date(),
            activeUsers: Number(counts?.active_user_count ?? 0n),
            authenticatedUsers: Number(counts?.authenticated_user_count ?? 0n),
            anonymousUsers: Number(counts?.anonymous_user_count ?? 0n),
        };
    }

    async countEventsByInteractionTypeByDomainKey(key: string) {
        const domain = await this.prismaService.domain.findUnique({
            where: {
                Key: key,
            },
        });

        if (!domain) throw new NotFoundException('Domain not found');

        const grouped = await this.prismaService.$queryRaw<{
            event_type_id: number;
            action_type: ActionType | null;
            event_count: bigint;
        }[]>`
            SELECT
                e."EventTypeId" AS event_type_id,
                tr."ActionType" AS action_type,
                COUNT(*)::bigint AS event_count
            FROM "Event" e
                INNER JOIN "TrackingRule" tr ON tr."Id" = e."TrackingRuleId"
            WHERE tr."DomainID" = ${domain.Id}
            GROUP BY e."EventTypeId", tr."ActionType"
        `;

        const countByType = new Map<string, number>();

        for (const row of grouped) {
            const label = this.resolveInteractionTypeLabel(row.event_type_id, row.action_type);
            const currentCount = countByType.get(label) ?? 0;
            countByType.set(label, currentCount + Number(row.event_count));
        }

        const breakdown = Array.from(countByType.entries())
            .map(([interactionType, count]) => ({ interactionType, count }))
            .sort((a, b) => b.count - a.count);

        const totalEvents = breakdown.reduce((sum, item) => sum + item.count, 0);

        return {
            domainKey: key,
            totalEvents,
            breakdown,
        };
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
