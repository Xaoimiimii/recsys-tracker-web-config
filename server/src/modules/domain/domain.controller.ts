import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DomainService } from './domain.service';
import { JwtAuthGuard } from '../auth/guard';
import { CreateDomainDto } from './dto/create-domain.dto';

@Controller('domain')
export class DomainController {
    constructor(private domainService: DomainService) { }

    // @UseGuards(JwtAuthGuard)
    @Post('create')
    async createDomain(@Body() body: CreateDomainDto) {
        const { ternantId, url, type } = body;
        console.log(body);
        return this.domainService.createDomain(ternantId, url, type);
    }
}
