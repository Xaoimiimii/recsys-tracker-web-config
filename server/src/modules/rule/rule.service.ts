import { Prisma } from './../../generated/prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRuleDto } from './dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RuleService {
    constructor(private prisma: PrismaService) { }


    async getOperators() {
        const operators = await this.prisma.operator.findMany();
        return operators;
    }

    async createRule(rule: CreateRuleDto) {
        if (
            !rule.Name ||
            !rule.DomainKey ||
            !rule.EventTypeId
        )
            throw new BadRequestException('Missing required fields to create rule.');

        const domain = await this.prisma.domain.findUnique({
            where: {
                Key: rule.DomainKey,
            },
        });

        if (!domain) throw new NotFoundException(`Domain key '${rule.DomainKey}' does not exist.`);

        if (
            !(await this.prisma.eventType.findUnique({
                where: {
                    Id: rule.EventTypeId,
                },
            }))
        )
            throw new NotFoundException(`Event type id '${rule.EventTypeId}' does not exist.`);


        const createdRule = await this.prisma.trackingRule.create({
            data: {
                Name: rule.Name,
                DomainID: domain.Id,
                EventTypeID: rule.EventTypeId,
                TrackingTarget: rule.TrackingTarget,
                ActionType: rule.ActionType,
            },
        });

        for (const payloadMapping of rule.PayloadMapping)
        {
            await this.prisma.payloadMapping.create({
                data: {
                    Field: payloadMapping.Field,
                    Source: payloadMapping.Source,
                    TrackingRuleId: createdRule.Id,
                    Config: payloadMapping.Config as Prisma.InputJsonValue
                }
            })
        }
        
        return createdRule;
    }

    async getRuleById(id: number) {
        const rule = await this.prisma.trackingRule.findUnique({
            where: {
                Id: id,
            },
            include: {
                EventType: true,
                PayloadMappings: true
            }
        });
        return rule;
    }

    async getRulesByDomainKey(domainKey: string) {
        const domain = await this.prisma.domain.findUnique({
            where: {
                Key: domainKey,
            },
        });
        if (!domain) return null;

        const rules = await this.prisma.trackingRule.findMany({
            where: {
                DomainID: domain.Id,
            },
            include: {
                EventType: true,
                PayloadMappings: true
            },
        });
        return rules;
    }

    async getAllEventTypes() {
        const types = await this.prisma.eventType.findMany();
        return types;
    }

    async deleteRule(id: number) {
        const existingRule = await this.prisma.trackingRule.findUnique({
            where: {
                Id: id,
            },
        });
        if (!existingRule) throw new NotFoundException(`Rule id ${id} not found`);

        await this.prisma.$transaction([
            this.prisma.payloadMapping.deleteMany({
                where: {
                    TrackingRuleId: id,
                },
            }),
            this.prisma.trackingRule.delete({
                where: {
                    Id: id,
                },
            }),
        ]);
    }

    async updateRule(data: UpdateRuleDto) {
        const existingRule = await this.prisma.trackingRule.findUnique({
            where: {
                Id: data.Id,
            },
        });
        if (!existingRule) throw new NotFoundException(`Rule id ${data.Id} not found`);

        const updateData: any = {};

        if (data.Name) updateData.Name = data.Name;
        if (data.ActionType) updateData.ActionType = data.ActionType;

        if (data.EventTypeId) {
            const eventType = await this.prisma.eventType.findUnique({
                where: {
                    Id: data.EventTypeId,
                },
            });
            if (!eventType) throw new NotFoundException(`Event type id '${data.EventTypeId}' does not exist.`);
            updateData.EventTypeID = data.EventTypeId;
        }

        if (data.TrackingTarget) updateData.TrackingTarget = data.TrackingTarget;

        if (data.PayloadMapping) {
            await this.prisma.payloadMapping.deleteMany({
                where: {
                    TrackingRuleId: data.Id
                }
            });

            await Promise.all(data.PayloadMapping.map(payloadMapping => 
                this.prisma.payloadMapping.create({
                    data: {
                        Field: payloadMapping.Field,
                        Source: payloadMapping.Source,
                        TrackingRuleId: data.Id,
                        Config: payloadMapping.Config as Prisma.InputJsonValue
                    }
                })
            ))
        }

        const updatedRule = await this.prisma.trackingRule.update({
            where: {
                Id: data.Id,
            },
            data: updateData,
            include: {
                EventType: true
            },
        });

        return updatedRule;
    }
}