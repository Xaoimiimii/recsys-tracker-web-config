import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { DomainService } from './domain.service';
import { JwtAuthGuard } from '../auth/guard';
import { CreateDomainDto } from './dto/create-domain.dto';
import type { Request } from 'express';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateUserIdentityDto } from './dto/update-user-identity.dto';

@Controller('domain')
export class DomainController {
    constructor(private domainService: DomainService) { }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create a new domain' })
    @Post('create')
    async createDomain(@Body() body: CreateDomainDto, @Req() req: Request) {
        const tenant = req.user;
        if (!tenant) throw new UnauthorizedException();
        return this.domainService.createDomain(tenant['Id'], body.url, body.type, body.UserIdentity);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get domains by tenant' })
    @Get('/ternant')
    async getDomainsByTernantId(@Req() req: Request) {
        const tenant = req.user;
        if (!tenant) throw new UnauthorizedException();
        return this.domainService.getDomainsByTernantId(tenant['Id']);
    }

    // @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user identity by domain key' })
    @Get("/user-identity")
    async getUserIdentity(
        @Query('key') key: string
    ) {
        return this.domainService.getUserIdentity(key);
    }

    @Patch("user-identity")
    @ApiOperation({ summary: 'Modify user identity' })
    async updateUserIdentity(@Body() dto: UpdateUserIdentityDto) {
        return this.domainService.updateUserIdentity(dto.Id, dto.Source, dto.RequestConfig, dto.Value, dto.Field);
    }

}
