import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService
    ) { }

    async signupLocal(dto: AuthDto): Promise<Tokens> {
        const hash = await bcrypt.hash(dto.password, 10);

        const new_user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash
            }
        })
            .catch((error) => {
                if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                    throw new ForbiddenException('Credentials incorrect');
                }
                throw error;
            });

        const tokens = await this.getTokens(new_user.id, new_user.email, new_user.role);
        await this.updateRtHash(new_user.id, tokens.refresh_token);

        return tokens;
    }

    async signinLocal(dto: AuthDto): Promise<Tokens> {

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });

        if (!user) { throw new ForbiddenException('Access Denied!'); }

        const password_matches = bcrypt.compare(dto.password, user.hash);
        if (!password_matches) { throw new ForbiddenException('Access Denied!'); }

        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRtHash(user.id, tokens.refresh_token);

        return tokens;
    }

    async logout(user_id: number) {
        await this.prisma.user.updateMany({
            where: {
                id: user_id,
                hashed_rt: { not: null },
            },
            data: { hashed_rt: null }
        });
        return { logout: true };
    }

    async refreshTokens(user_id: number, rt: string): Promise<Tokens> {
        const user = await this.prisma.user.findUnique({
            where: { id: user_id }
        });

        if (!user || !user.hashed_rt) { throw new ForbiddenException('Access Denied!'); }

        const rt_matches = await bcrypt.compare(rt, user.hashed_rt);
        if (!rt_matches) { throw new ForbiddenException('Access Denied!'); }

        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRtHash(user.id, tokens.refresh_token);

        return tokens;
    }

    async updateRtHash(user_id: number, rt: string): Promise<void> {
        const hash = await bcrypt.hash(rt, 10);

        await this.prisma.user.update({
            where: { id: user_id },
            data: { hashed_rt: hash }
        })
    }

    async getTokens(user_id: number, email: string, role: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: user_id,
                    id: user_id,
                    email,
                    role,
                },
                {
                    secret: this.config.get('AT_SECRET') as string,
                    expiresIn: 60 * 15
                }),
            this.jwtService.signAsync(
                {
                    sub: user_id,
                    id: user_id,
                    email,
                    role,
                },
                {
                    secret: this.config.get('RT_SECRET') as string,
                    expiresIn: 60 * 60 * 24 * 7
                })

        ]);

        return {
            access_token: at,
            refresh_token: rt
        };
    }
}
