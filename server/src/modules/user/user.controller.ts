import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';

@Controller('users')
export class UserController {
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Req() req: Request)
    {
        return req.user;
    }
}
