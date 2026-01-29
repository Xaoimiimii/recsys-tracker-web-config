import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto, SignUpDto } from "./dto";
import * as argon2 from 'argon2';
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { log } from "console";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
    ) { }

    async signup(dto: SignUpDto) {
        const existing = await this.prisma.ternant.findUnique({
            where: {
                Username: dto.username
            }
        });
        if (existing) {
            throw new HttpException(
                { statusCode: HttpStatus.CONFLICT, message: 'Username already exists' },
                HttpStatus.CONFLICT
            );
        }
        const hash = await argon2.hash(dto.password);
        const ternant = await this.prisma.ternant.create({
            data: {
                Username: dto.username,
                Password: hash,
                Name: dto.name
            },
            select: {
                Id: true,
                Username: true,
                Name: true
            }
        })
        return ternant;
    }

    async signin(dto: AuthDto, res: Response) {
        const ternant = await this.prisma.ternant.findUnique({
            where: {
                Username: dto.username
            }
        });
        if (!ternant) {
            throw new HttpException(
                { statusCode: HttpStatus.UNAUTHORIZED, message: 'Username does not exist' },
                HttpStatus.UNAUTHORIZED
            );
        }
        const isPasswordValid = await argon2.verify(ternant.Password, dto.password);
        if (!isPasswordValid) {
            throw new HttpException(
                { statusCode: HttpStatus.UNAUTHORIZED, message: 'Invalid username or password' },
                HttpStatus.UNAUTHORIZED
            );
        }

        const tokens = await this.signToken(ternant.Id, ternant.Username, ternant.Name, ternant.Role);

        this.setRefreshToken(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: ternant.Id,
                username: ternant.Username,
                name: ternant.Name,
                role: ternant.Role
            }
        };
    }

    async signToken(ternantId: number, username: string, name: string, role: string): Promise<{ accessToken: string, refreshToken: string }> {
        const payload = {
            sub: ternantId,
            username: username,
            name: name,
            role: role
        };

        const accessToken = await this.jwt.signAsync(payload, {
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES'),
            secret: this.config.get('JWT_ACCESS_SECRET')
        });

        const refreshToken = await this.jwt.signAsync(payload, {
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES'),
            secret: this.config.get('JWT_REFRESH_SECRET')
        });

        return { accessToken: accessToken, refreshToken: refreshToken };
    }

    setRefreshToken(res: Response, refreshToken: string) {
        res.cookie('RefreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: this.config.get<number>('COOKIE_EXPIRATION'),
        });
    }

    async refresh(res: Response, token: string) {
        try {
            const payload = await this.jwt.verifyAsync(
                token,
                {
                    secret: this.config.get('JWT_REFRESH_SECRET')
                }
            );

            const tokens = await this.signToken(payload.sub, payload.username, payload.name, payload.role);
            this.setRefreshToken(res, tokens.refreshToken);
            return {
                accessToken: tokens.accessToken,
                user: {
                    id: payload.sub,
                    username: payload.username,
                    name: payload.name,
                    role: payload.role
                }
            };
        } catch (error) {
            throw new Error("Invalid refresh token");
        }
    }
}