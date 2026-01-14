import { Condition } from './../../generated/prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRuleDto } from './dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RuleService {
    constructor(private prisma: PrismaService) { }

    async getPatterns() {
        const patterns = await this.prisma.pattern.findMany();
        return patterns;
    }

    // async getPayloadPatterns() {
    //     const payloadPatterns = await this.prisma.payloadPattern.findMany();
    //     return payloadPatterns;
    // }

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

        const patterns = await this.prisma.pattern.findMany();
        const operators = await this.prisma.operator.findMany();

        // validate conditions
        for (const condition of rule.Conditions) {
            if (!patterns.find((ep) => ep.Id === condition.PatternId))
                throw new NotFoundException(`Pattern id '${condition.PatternId}' does not exist.`);
            if (!operators.find((op) => op.Id === condition.OperatorId))
                throw new NotFoundException(`Operator id '${condition.OperatorId}' does not exist.`);
            if (!condition.Value) throw new BadRequestException('Condition value is required.');
        }

        const trackingTarget = await this.prisma.trackingTarget.create({
            data: {
                Value: rule.TrackingTarget.Value,
                PatternId: rule.TrackingTarget.PatternId,
                OperatorId: rule.TrackingTarget.OperatorId,
            }
        });

        if (!trackingTarget) throw new BadRequestException('Error creating tracking target for the rule.');

        const createdRule = await this.prisma.trackingRule.create({
            data: {
                Name: rule.Name,
                DomainID: domain.Id,
                EventTypeID: rule.EventTypeId,
                TrackingTargetId: trackingTarget.Id,
                PayloadMappings: {
                    create: rule.PayloadMappings.map((pm) => ({
                        Field: pm.Field,
                        Source: pm.Source,
                        Value: pm.Value,
                        RequestUrlPattern: pm.RequestUrlPattern,
                        RequestMethod: pm.RequestMethod,
                        RequestBodyPath: pm.RequestBodyPath,
                        UrlPart: pm.UrlPart,
                        UrlPartValue: pm.UrlPartValue,
                    })),
                },
                Conditions: {
                    create: rule.Conditions.map(c => ({
                        Value: c.Value,
                        Pattern: {
                            connect: { Id: c.PatternId }
                        },
                        Operator: {
                            connect: { Id: c.OperatorId }
                        }
                    }))
                },
                ActionType: rule.ActionType,
            },
            include: {
                PayloadMappings: true,
                Conditions: true,
                TrackingTarget: true,
            },
        });

        return createdRule;
    }

    async getRuleById(id: number) {
        const rule = await this.prisma.trackingRule.findUnique({
            where: {
                Id: id,
            },
            include: {
                PayloadMappings: true,
                Conditions: true,
                TrackingTarget: true,
            },
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
                PayloadMappings: true,
                Conditions: true,
                TrackingTarget: true,
                EventType: true
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

        await this.prisma.trackingRule.delete({
            where: {
                Id: id,
            },
        });
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

        if (data.TrackingTarget) {
            if (!(await this.prisma.operator.findUnique({
                where: {
                    Id: data.TrackingTarget.OperatorId,
                },
            }))) throw new NotFoundException(`Operator id '${data.TrackingTarget.OperatorId}' does not exist.`);

            if (!(await this.prisma.pattern.findUnique({
                where: {
                    Id: data.TrackingTarget.PatternId,
                },
            }))) throw new NotFoundException(`Pattern id '${data.TrackingTarget.PatternId}' does not exist.`);

            updateData.TrackingTarget = {
                update: {
                    Value: data.TrackingTarget.Value,
                    PatternId: data.TrackingTarget.PatternId,
                    OperatorId: data.TrackingTarget.OperatorId,
                },
            };
        }

        if (data.Conditions) {
            const patterns = await this.prisma.pattern.findMany();
            const operators = await this.prisma.operator.findMany();

            for (const condition of data.Conditions) {
                if (!patterns.find((ep) => ep.Id === condition.PatternId)) throw new NotFoundException(`Pattern id '${condition.PatternId}' does not exist.`);
                if (!operators.find((op) => op.Id === condition.OperatorId)) throw new NotFoundException(`Operator id '${condition.OperatorId}' does not exist.`);
                if (!condition.Value) throw new BadRequestException('Condition value is required.');
            }

            updateData.Conditions = {
                deleteMany: {},
                create: data.Conditions.map(c => ({
                    Value: c.Value,
                    Pattern: {
                        connect: { Id: c.PatternId }
                    },
                    Operator: {
                        connect: { Id: c.OperatorId }
                    }
                }))
            };
        }

        if (data.PayloadMappings) {
            updateData.PayloadMappings = {
                deleteMany: {},
                create: data.PayloadMappings.map((pm) => ({
                    Field: pm.Field,
                    Source: pm.Source,
                    Value: pm.Value,
                    RequestUrlPattern: pm.RequestUrlPattern,
                    RequestMethod: pm.RequestMethod,
                    RequestBodyPath: pm.RequestBodyPath,
                    UrlPart: pm.UrlPart,
                    UrlPartValue: pm.UrlPartValue,
                })),
            };
        }

        const updatedRule = await this.prisma.trackingRule.update({
            where: {
                Id: data.Id,
            },
            data: updateData,
            include: {
                PayloadMappings: true,
                Conditions: true,
                TrackingTarget: true,
                EventType: true
            },
        });

        return updatedRule;
    }
}