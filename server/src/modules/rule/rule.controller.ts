import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import { RuleService } from './rule.service';
import { CreateRuleDto } from './dto';
import { JwtAuthGuard } from 'src/modules/auth/guard';

@Controller('rule')
export class RuleController {
    constructor(private ruleService: RuleService) {}

    // @UseGuards(JwtAuthGuard)
    @Get('pattern')
    async getPatterns() {
        const patterns = await this.ruleService.getPatterns();
        return patterns;
    }

    // @UseGuards(JwtAuthGuard)
    // @Get('payload-patterns')
    // async getPayloadPatterns() {
    //     const payloadPatterns = await this.ruleService.getPayloadPatterns();
    //     return payloadPatterns;
    // }

    // @UseGuards(JwtAuthGuard)
    @Get('operators')
    async getOperators() {
        const operators = await this.ruleService.getOperators();
        return operators;
    }

    // @UseGuards(JwtAuthGuard)
    @Post('create')
    async createRule(@Body() rule: CreateRuleDto) {
        const createdRule = await this.ruleService.createRule(rule);
        if (!createdRule) {
            throw new HttpException(
                { statusCode: 404, message: 'Some error occurred' },
                HttpStatus.NOT_FOUND,
            );
        }

        return {
            statusCode: HttpStatus.CREATED,
            message: 'Rule was created successfully',
        };
    }

    // @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getRule(@Param('id', ParseIntPipe) id: number)
    {
        const rule = await this.ruleService.getRuleById(id);
        if (!rule) {
            throw new HttpException(
                { statusCode: 404, message: 'Rule not found' },
                HttpStatus.NOT_FOUND,
            );
        }
        return rule;
    }

    // @UseGuards(JwtAuthGuard)
    @Get('/domain/:key')
    async getRulesByDomainKey(@Param('key') key: string) {
        const rules = await this.ruleService.getRulesByDomainKey(key);
        if (!rules) {
            throw new NotFoundException(`No rules found for domain key '${key}'.`);
        }

        const result = rules.map(r => ({ id: r.Id, name: r.Name, EventTypeName: r.EventType.Name }));
        return result;
    }
}
