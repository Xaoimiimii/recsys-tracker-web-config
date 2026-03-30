import {
    StreamableFile,
    Controller,
    Get,
    Query,
    Res,
    ParseIntPipe,
    DefaultValuePipe,
    BadRequestException,
} from '@nestjs/common';
import { EventService } from './event.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';

@Controller('event')
export class EventController {
    constructor(private eventService: EventService) {}

    @ApiOperation({ summary: 'Count active users in the last X minutes of a domain' })
    @ApiQuery({ name: 'key', required: true, type: String })
    @ApiQuery({ name: 'minutes', required: true, type: Number })
    @Get('/domain/active-users/count')
    async countActiveUsersByMinutes(
        @Query('key') key: string,
        @Query('minutes', ParseIntPipe) minutes: number,
    ) {
        return this.eventService.countActiveUsersByDomainKeyAndMinutes(key, minutes);
    }

    @ApiOperation({ summary: 'Count current events by interaction type classification of a domain' })
    @ApiQuery({ name: 'key', required: true, type: String })
    @Get('/domain/interaction-types/count')
    async countEventsByInteractionType(
        @Query('key') key: string,
    ) {
        return this.eventService.countEventsByInteractionTypeByDomainKey(key);
    }

    @ApiOperation({ summary: 'Get last K events of a domain' })
    @ApiQuery({ name: 'ruleId', required: false, type: Number })
    @Get('/domain/last')
    async getKEventsDomain(
        @Query('key') key: string,
        @Query('k', new DefaultValuePipe(20), ParseIntPipe) k: number,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('ruleId') ruleId?: string,
    ) {
        let parsedRuleId: number | undefined;

        if (ruleId !== undefined) {
            parsedRuleId = Number(ruleId);
            if (Number.isNaN(parsedRuleId)) {
                throw new BadRequestException('ruleId must be a number');
            }
        }
        return this.eventService.getKEventsByDomainKey(key, k, page, parsedRuleId);
    }

    @ApiOperation({ summary: 'Get last K events of a tracking rule' })
    @Get('/tracking-rule/last')
    async getKEventsTrackingRule(
        @Query('id', ParseIntPipe) id: number,
        @Query('k', new DefaultValuePipe(20), ParseIntPipe) k: number,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    ) {
        return this.eventService.getKEventsByTrackingRuleId(id, k, page);
    }

    @ApiOperation({ summary: 'Export events of a domain to Excel file' })
    @ApiQuery({ name: 'key', required: true, type: String })
    @ApiQuery({ name: 'ruleId', required: false, type: Number })
    @Get('/domain/export')
    async exportDomainEvents(
        @Query('key') key: string,
        @Query('ruleId') ruleId: string | undefined,
        @Res({ passthrough: true }) res: Response,
    ) {
        let parsedRuleId: number | undefined;

        if (ruleId !== undefined) {
            parsedRuleId = Number(ruleId);
            if (Number.isNaN(parsedRuleId)) {
                throw new BadRequestException('ruleId must be a number');
            }
        }

        const result = await this.eventService.exportEventsByDomainKeyToExcel(key, parsedRuleId);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
        res.setHeader('X-Total-Records', result.total.toString());

        return new StreamableFile(result.buffer);
    }
}
