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
        const tokens = await this.authService.signin(dto, res);
        // res.cookie('AccessToken', tokens.accessToken, {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'none',
        //     maxAge: this.config.get<number>('COOKIE_EXPIRATION'),
        // });
    
        // return { message: 'Đăng nhập thành công' };
        return tokens;
    }

    @Post('signout')
    signout(@Res({passthrough: true}) res: Response)
    {
        res.clearCookie('AccessToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });
        res.clearCookie('RefreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });
        return { message: 'Đăng xuất thành công' };
    }

    @Post('refresh')
    async refresh(@Res({passthrough: true}) res: Response, @Req() req)
    {
        const refreshToken = req.cookies?.RefreshToken;
        if (!refreshToken) {
            throw new Error('No refresh token provided');
        }

        return this.authService.refresh(res, refreshToken);
    }
}