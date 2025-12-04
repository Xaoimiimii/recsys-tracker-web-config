import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto, SignUpDto } from "./dto";
import * as argon2 from 'argon2';
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
    ) { }
    
    async signup(dto: SignUpDto) {
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

    async signin(dto: AuthDto) {
        const ternant = await this.prisma.ternant.findUnique({
            where: {
                Username: dto.username
            }
        });
        if (!ternant) {
            throw new Error('Invalid username or password');
        }
        const isPasswordValid = await argon2.verify(ternant.Password, dto.password);
        if (!isPasswordValid) {
            throw new Error('Invalid username or password');
        }

        return this.signToken(ternant.Id, ternant.Username);
    }

    async signToken(ternantId: number, username: string) : Promise<{accessToken: string}> {
        const payload = {
            sub: ternantId,
            username: username
        };

        const token = await this.jwt.signAsync(payload, {
            expiresIn: this.config.get('JWT_EXPIRATION'),
            secret: this.config.get('JWT_SECRET')
        });

        return { accessToken: token };
    }
}