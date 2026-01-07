import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ReturnType } from 'src/generated/prisma/enums';
import { CustomizingFieldValueDto } from './dto/create-return-method.dto';

@Injectable()
export class ReturnMethodService {
    constructor(private prisma: PrismaService) { }
    
    async getReturnMethodsByDomainKey(key: string) {
        const domain = await this.prisma.domain.findUnique({
            where: {
                Key: key
            }
        });

        if (!domain) throw new NotFoundException("Domain not found");

        const domainReturns = await this.prisma.returnMethod.findMany({
            where: {
                DomainID: domain.Id
            },
        });
        return domainReturns;
    }

    async createReturnMethod(
        key: string,
        configurationName: string,
        returnType: ReturnType,
        value: string,
        operatorId: number,
        delayDuration: number,
        customizingFields: Record<string, CustomizingFieldValueDto>,
        layoutJson: Record<string, any>,
        styleJson: Record<string, any>,
    ) {
        if (delayDuration < 0) {
            throw new BadRequestException('Delay duration must be a non-negative number');
        }

        const usedPositions = new Set<number>();
        for (const [key, value] of Object.entries(customizingFields)) {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                throw new BadRequestException(`Customizing field "${key}" must be a valid object`);
            }

            if ('position' in value) {
                const pos = value.position;
                if (typeof pos !== 'number' || pos < 0) {
                    throw new BadRequestException(`Customizing field "${key}".position must be a number >= 0`);
                }

                if (pos !== 0) {
                    if (usedPositions.has(pos)) {
                        throw new BadRequestException(`Customizing field position value "${pos}" cannot be duplicated`);
                    }
                    usedPositions.add(pos);
                }
            }

            if ('isEnabled' in value && typeof value.isEnabled !== 'boolean') {
                throw new BadRequestException(`Customizing field "${key}".isEnabled must be boolean`);
            }
        }

        const domain = await this.prisma.domain.findUnique({
            where: {
                Key: key
            }
        });

        if (!domain) throw new NotFoundException('Domain not found');

        const operator = await this.prisma.operator.findUnique({
            where: {
                Id: operatorId
            }
        });

        if (!operator) throw new NotFoundException('Operator not found');

        const domainReturn = await this.prisma.returnMethod.create({
            data: {
                DomainID: domain.Id,
                ConfigurationName: configurationName,
                ReturnType: returnType,
                Value: value,
                OperatorID: operatorId,
                Customizing: customizingFields as any,
                Layout: layoutJson,
                Style: styleJson,
                Delay: delayDuration,
            }
        });

        return domainReturn;
    }

    async updateReturnMethod(
        id: number,
        configurationName?: string,
        operatorId?: number,
        value?: string,
        customizingFields?: Record<string, any>[],
        layoutJson?: Record<string, any>,
        styleJson?: Record<string, any>,
        delayDuration?: number,
    ) {
        const existingReturnMethod = await this.prisma.returnMethod.findUnique({
            where: {
                Id: id
            }
        });

        if (!existingReturnMethod) {
            throw new NotFoundException(`Return method id ${id} not found`);
        }

        if (operatorId !== undefined) {
            const operator = await this.prisma.operator.findUnique({ where: { Id: operatorId } });
            if (!operator) throw new NotFoundException('Operator not found');
        }

        if (delayDuration !== undefined && delayDuration < 0) {
            throw new BadRequestException('Delay duration must be a non-negative number');
        }

        if (customizingFields && customizingFields.length > 0) {
            const usedPositions = new Set<number>();
            for (const [key, value] of Object.entries(customizingFields)) {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    throw new BadRequestException(`Customizing field "${key}" must be a valid object`);
                }

                if ('position' in value) {
                    const pos = value.position;
                    if (typeof pos !== 'number' || pos < 0) {
                        throw new BadRequestException(`Customizing field "${key}".position must be a number >= 0`);
                    }

                    if (pos !== 0) {
                        if (usedPositions.has(pos)) {
                            throw new BadRequestException(`Customizing field position value "${pos}" cannot be duplicated`);
                        }
                        usedPositions.add(pos);
                    }
                }
                if (!('isEnabled' in value)) {
                    throw new BadRequestException(`Customizing field "${key}" must have isEnabled property`);
                }
                
                if (typeof value.isEnabled !== 'boolean') {
                    throw new BadRequestException(`Customizing field "${key}".isEnabled must be boolean`);
                }
            }
        }

        return await this.prisma.returnMethod.update({
            where: { Id: id },
            data: {
                ConfigurationName: configurationName,
                OperatorID: operatorId,
                Value: value,
                Customizing: customizingFields,
                Layout: layoutJson,
                Style: styleJson,
                Delay: delayDuration,
            },
        });
    }

    async deleteReturnMethod(id: number) {
        const existingReturnMethod = await this.prisma.returnMethod.findUnique({
            where: {
                Id: id
            }
        });
        if (!existingReturnMethod) {
            throw new NotFoundException(`Return method id ${id} not found`);
        }
        await this.prisma.returnMethod.delete({
            where: {
                Id: id
            }
        });
        return;
    }

    async getReturnMethodById(id: number) {
        const returnMethod = await this.prisma.returnMethod.findUnique({
            where: {
                Id: id
            },
            include: {
                Operator: true,
            }
        });
        if (!returnMethod) {
            throw new NotFoundException(`Return method id ${id} not found`);
        }
        return returnMethod;
    }
}