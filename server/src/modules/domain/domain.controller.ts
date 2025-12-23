import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { DomainService } from './domain.service';
import { JwtAuthGuard } from '../auth/guard';
import { CreateDomainDto } from './dto/create-domain.dto';
import type { Request } from 'express';
import { ApiOperation } from '@nestjs/swagger';

@Controller('domain')
export class DomainController {
    constructor(private domainService: DomainService) { }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new domain' })
    @Post('create')
    async createDomain(@Body() body: CreateDomainDto, @Req() req: Request) {
        const { url, type } = body;
        const tenant = req.user;
        if (!tenant) throw new UnauthorizedException();
        return this.domainService.createDomain(tenant['Id'], url, type);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get domains by tenant' })
    @Get('/ternant')
    async getDomainsByTernantId(@Req() req: Request) {
        const tenant = req.user;
        if (!tenant) throw new UnauthorizedException();
        return this.domainService.getDomainsByTernantId(tenant['Id']);
    }
}
