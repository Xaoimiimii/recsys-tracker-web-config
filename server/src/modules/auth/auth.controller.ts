import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, SignUpDto } from "./dto";
import type { Response } from "express";
import { ConfigService } from "@nestjs/config";

@Controller('auth')
export class AuthController { 
    constructor(private authService: AuthService, private config: ConfigService) { }
    
    @Post('signup')
    signup(@Body() dto: SignUpDto)
    {
        return this.authService.signup(dto);
    }
    
    @Post('signin')
    async signin(@Body() dto: AuthDto, @Res({passthrough: true}) res: Response)
    {
        const token = await this.authService.signin(dto);
        res.cookie('AccessToken', token.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: this.config.get<number>('COOKIE_EXPIRATION'),
        });
    
        return { message: 'Đăng nhập thành công' };
    }

    @Post('signout')
    signout(@Res({passthrough: true}) res: Response)
    {
        res.clearCookie('AccessToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });
        return { message: 'Đăng xuất thành công' };
    }
}