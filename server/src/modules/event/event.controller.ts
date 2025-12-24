import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { EventService } from './event.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('event')
export class EventController {
    constructor(private eventService: EventService) { }

    @ApiOperation({ summary: 'Get last K events of a domain' })
    @Get('/domain/last')
    async getKEventsDomain(
        @Query('key') key: string,
        @Query('k', ParseIntPipe) k: number) {
        return this.eventService.getKEventsByDomainKey(key, k);
    }

    @ApiOperation({ summary: 'Get last K events of a tracking rule' })
    @Get('/tracking-rule/last')
    async getKEventsTrackingRule(
        @Query('id', ParseIntPipe) id: number,
        @Query('k', ParseIntPipe) k: number) {
        return this.eventService.getKEventsByTrackingRuleId(id, k);
    }
}
